---
title: "Runbook"
---

One section per alert in the [example rules](/docs/operations/monitoring#example-prometheus-rules). Each alert
links here by name. A section says what the alert means, what to check first and how to fix
it. The commands assume a Kubernetes deployment (`kubectl`) and `psql` access to the database;
translate them for Docker or a bare binary.

Three things help with almost every alert:

- **Logs.** The process logs structured JSON. Failed jobs log `river job errored` or
  `river job panicked` with `kind`, `queue`, `job_id` and `attempt`; provider hooks log
  `hooks/ses: ...` lines with the `workspace_id`.
- **`/readyz`.** If it returns `503`, the database is the first suspect.
- **Rollouts.** Check whether the alert started with a deploy or a migration
  ([Upgrading](/docs/operations/upgrading)) before digging further.

## SphericonDown

**Means.** Prometheus cannot scrape a Sphericon metrics target for 5 minutes. The process is down,
unreachable, or the metrics listener is not enabled.

**Check.**

1. Are the pods running and ready? `kubectl get pods -l app.kubernetes.io/name=sphericon`
2. Why did they stop? `kubectl describe pod ...` (OOMKilled, failed probe) and
   `kubectl logs --previous ...`.
3. Is it only the scrape? Hit `/healthz` on the public port. If the app is fine, check
   `SPHERICON_METRICS_ADDR` (or `metrics.enabled`), the metrics Service and any network policy between
   Prometheus and the pod.
4. If `/readyz` returns `503`, the database is unreachable: see
   [`SphericonDBPoolSaturated`](#sphericondbpoolsaturated) and check PostgreSQL itself.

**Fix.** Restart on a crash loop caused by configuration (a missing secret, an invalid
`SPHERICON_ENCRYPTION_KEY`, a port clash between `PORT` and `SPHERICON_METRICS_ADDR` all fail startup with a clear
log line). After a bad deploy, roll back the image. Pending migrations are not applied
automatically with several replicas: run them as described in [Upgrading](/docs/operations/upgrading).

## SphericonCollectErrorRatioHigh

**Means.** More than 1% of `/collect` requests (tracker events and identifies from customer
sites) answered 5xx. Those events are lost unless the client retries, so this is the most
urgent request alert.

**Check.**

1. Which operation? `sum by (operation_id, http_response_status_code) (rate(ogen_server_request_count_total{operation_id=~"Collect.*"}[5m]))`.
2. The collect path writes the Event row and its domain-event jobs in PostgreSQL, in the
   request's transaction, so look for database trouble first: `/readyz`, [`SphericonDBPoolSaturated`](#sphericondbpoolsaturated),
   [`SphericonDBPoolWaits`](#sphericondbpoolwaits), disk full, a failover in progress.
3. Read the error logs of the failing pods for the underlying error.

**Fix.** Restore database health (free disk, resolve locks, fail over). If a deploy caused it,
roll back. If load is the cause, add replicas, but check the pool sizes first, because each
replica adds connections.

## SphericonSiteErrorRatioHigh

**Means.** More than 5% of dashboard API (`/site`) requests answered 5xx for 10 minutes. People
see errors in the UI.

**Check.**

1. Narrow it down: `topk(10, sum by (operation_id) (rate(ogen_server_request_count_total{operation_id=~"Site.*", http_response_status_code=~"5.."}[5m])))`.
   One operation points at a bug or a slow query, all of them point at the database or a deploy.
2. Compare with [`SphericonRequestLatencyHigh`](#sphericonrequestlatencyhigh) and the pool alerts.
3. Look at the logs for the failing operation and at what changed (deploy, migration, a large
   import or broadcast running at the same time).

**Fix.** Roll back a bad release, relieve the database, or fix the failing query. A single
operation failing for a single workspace is usually a data problem, not an outage.

## SphericonApiErrorRatioHigh

**Means.** More than 5% of external API (`/api`, also used by MCP clients) requests answered
5xx for 10 minutes. Integrations calling your instance are failing.

**Check.** The same as [`SphericonSiteErrorRatioHigh`](#sphericonsiteerrorratiohigh), with
`operation_id!~"Site.*|Collect.*"`. Also look for one noisy client: a large batch import can
saturate the database for everyone.

**Fix.** As for `/site`. If one client is the cause, ask it to slow down or lower its batch
size.

## SphericonRequestLatencyHigh

**Means.** The 95th percentile of `/site` and `/api` request duration has been above 2 seconds
for 15 minutes. `/collect` is excluded because it should always be fast.

**Check.**

1. Which operations are slow?
   `histogram_quantile(0.95, sum by (le, operation_id) (rate(ogen_server_duration_milliseconds_bucket{operation_id!~"Collect.*"}[5m])))`
2. Is the database the bottleneck? Check pool usage and waits
   ([`SphericonDBPoolSaturated`](#sphericondbpoolsaturated)) and PostgreSQL itself (CPU, IO, long
   queries in `pg_stat_activity`).
3. Large `events` tables make segment and analytics queries slow; confirm Event retention is
   running ([ADR 0019](https://github.com/getsphericon/sphericon/blob/main/docs/adr/0019-event-retention.md)).

**Fix.** Kill or fix the slow query, add a missing index, or scale the database. Adding
replicas does not help if the database is the limit.

## SphericonJobQueueBacklog

**Means.** In one river queue (`default`, `broadcasts`, `webhooks`, `http_steps` or `events`) the
oldest job that is ready to run has been waiting more than 15 minutes.

The `events` queue carries the domain events: each consumer that wants an event (suppression,
orders, automations, rules, report projections, Notices, the webhook fan-out and, on the Enterprise Edition, the Audit log and
the erasures export) gets a job of its own there. A backlog in `events` delays all of them:
bouncing and complaining addresses stay sendable, Automations and Rules react late and webhooks
go out late. The Event rows themselves are written when the event is published, so Segments and
Event-based evaluations see them immediately. Message engagement and email delivery stamps and
Broadcast unsubscribe attribution follow their report jobs and may lag.

**Check.**

1. Is it just load? A large broadcast or import legitimately queues many jobs. If
   `river_queue_depth` is high but falling, wait.
2. Is anything being worked? `sum by (queue) (rate(river_work_count_total[5m]))`. Zero with a
   growing backlog means the workers are not running or are stuck.
3. Are the jobs failing and retrying? See
   [`SphericonJobFailureRatioHigh`](#sphericonjobfailureratiohigh).
4. The queue fetches and completes jobs through its own `river` pool, and the workers do their work
   through the `sql` pool: check `db_sql_connection_open{status="inuse"}` of both against
   `db_sql_connection_max_open`
   ([`SphericonDBPoolSaturated`](#sphericondbpoolsaturated)).
5. Check that the river schema is applied. It is created by `sphericon migrate`; an instance that
   skipped migration has no job tables and the job metrics and workers fail.

**Fix.** Restart stuck pods, raise the size of the pool that is the limit
(`SPHERICON_RIVER_DB_MAX_CONNS` or `SPHERICON_DB_MAX_OPEN_CONNS`, and the database `max_connections`
accordingly), or add replicas. Worker concurrency per queue is fixed
in the binary.

## SphericonJobFailureRatioHigh

**Means.** More than 20% of job attempts in a queue ended in `error` or `panic` for 30
minutes. Because retries count, this overstates how many jobs end up discarded, but a
sustained high ratio always needs a look.

**Check.**

1. Which kind? `topk(10, sum by (kind) (rate(river_work_count_total{status!="ok"}[15m])))`.
   The domain-event consumers are the kinds that start with `event_` (`event_suppress`,
   `event_order`, `event_message_observation`, `event_broadcast_unsubscribe`, `event_notice`,
   `event_webhook`, and `event_audit` and
   `event_export_erasure` on the Enterprise Edition), all in the `events` queue. Each retries on
   its own, so one failing consumer holds up neither the other consumers nor other events.
   Automation and Rule evaluations use `automation_evaluate_trigger` and `rule_evaluate_event`.
2. Read the `river job errored` and `river job panicked` log lines for that `kind`; they carry
   the error, `attempt` and `max_attempts`.
3. Common causes: the email provider rejecting sends (see
   [`SphericonEmailSendErrorsHigh`](#sphericonemailsenderrorshigh)), a customer's webhook endpoint
   down (the `webhooks` queue retries up to 10 times), DNS for sending-domain checks, or a bug.
4. Jobs that used up their attempts are in state `discarded` and are kept for 30 days:

   ```sql
   SELECT kind, count(*), max(finalized_at)
   FROM river_job WHERE state = 'discarded'
   GROUP BY kind ORDER BY 2 DESC;
   ```

**Fix.** Fix the cause. Failing webhook deliveries to one customer endpoint are that
customer's problem; tell them. Discarded jobs are not retried automatically: after the fix, retry
them from the job queue's UI (River UI) in the Staff console, at `/staff/jobs`. It is served to a
signed-in Staff member, so it needs `SPHERICON_STAFF_JWT_SECRET` set (see the
[configuration reference](/docs/configuration)) and a Staff member (see
[First run](/docs/self-hosting#first-run)); without the secret `/staff` answers `404`. That is also how a domain
event a consumer gave up on is handled again. For work that is
no longer worth retrying, re-run the underlying action instead (for example, re-send the broadcast
to the missed recipients).

### Inspect the event journal

Inspect publication metadata for one Workspace, using its public id:

```sh
sphericon events list --workspace aB3dE6gH --name email.opened \
  --from 2026-11-08T00:00:00Z --before 2026-11-08T01:00:00Z --limit 100
```

Use `--instance` instead of `--workspace` for account and other Instance facts. These scopes
are separate: `--instance` never includes Workspace facts. One scope is required. Optional
`--name` and `--event-id` filters match exactly and combine with the time bounds. `--from` is
inclusive, `--before` exclusive, and both use the journal's **recording** time in RFC3339 format.
Either bound may be omitted.

The command writes JSON with `entries` and `truncated`. Each entry contains `eventId`, `name`,
`version`, `occurredAt`, `recordedAt` and `retainedConsumers`. It shows no original envelope,
personal payload or retained job arguments. Consumer names describe the inputs stored with that
publication, not whether a handler is currently enabled. An empty result is
`{"entries":[],"truncated":false}`.

Entries are newest recorded time first, with insertion order breaking ties. The default limit is
100 and the maximum 1000. If `truncated` is true, narrow the filters or increase the limit. This is
a bounded snapshot, not a journal cursor or a guarantee of publication commit order. Inspection
queues no jobs. A Workspace pending deletion remains inspectable until erasure removes its history.

### Reapply retained report measurements

When the original jobs have already been cleaned up, the event journal retains the anonymous
inputs of two report consumers: `event_message_observation` (human engagement and email delivery
stamps) and `event_broadcast_unsubscribe` (received-message opt-out attribution). Preview a bounded
interval first, using its **recording** time:

```sh
sphericon events replay --workspace aB3dE6gH --consumer event_message_observation \
  --from 2026-11-08T00:00:00Z --before 2026-11-08T01:00:00Z --dry-run
```

The output is `matched N; enqueued 0`. To queue the selected report's normal jobs, repeat the
command without `--dry-run`. The server's job runner processes them through the `events` queue;
the command itself starts no worker. A repeated command safely reapplies the same measurements.
Occurrence timestamps stay those of the accepted measurements, regardless of replay time or order.
For each report stamp, both consumers keep the earliest accepted observation; an earlier fact can
move a stamp earlier without counting the message or recipient twice.

`--from` is inclusive and `--before` exclusive. The default and maximum `--limit` is 1000 entries;
a larger selection is refused in full, so narrow the interval. Unsupported consumers or input
versions queue nothing. A Workspace pending deletion or already erased cannot be replayed.

Replay is not publication: it runs only the selected report consumer, without sending mail,
running Rules or Automations, delivering Webhooks or reapplying consent transitions. It does not
clear an existing projection or move an earliest timestamp forward. It repairs missing report
applications, not arbitrary incorrect report state. Other failed consumers still use River UI.

The journal starts with this version; earlier events are not reconstructed from Event projections.
It records metadata for every accepted fact, but stores only explicitly allowed anonymous replay
inputs, never the original personal envelope or an Invitation token. Metadata alone cannot replay
an arbitrary future consumer. Contact Erasure leaves accepted anonymous report inputs intact;
Workspace erasure removes its journal. The journal has no automatic expiry and consumes database
and backup space independently of Event retention. A replay sees one query snapshot; concurrent
publications retain their normal live jobs, with no cursor or commit-order guarantee.

## SphericonDBPoolSaturated

**Means.** One connection pool has been at or above 90% of its maximum for 10 minutes. `pool`
is `sql` (requests, ent, job workers; `SPHERICON_DB_MAX_OPEN_CONNS`, default 15) or
`river` (the job queue's own pool; `SPHERICON_RIVER_DB_MAX_CONNS`, default 25).

**Check.**

1. Slow queries holding connections: `SELECT pid, state, wait_event, now() - query_start AS age, left(query, 80) FROM pg_stat_activity WHERE datname = current_database() ORDER BY age DESC;`
2. Idle-in-transaction sessions or locks blocking others.
3. Does the total across replicas fit `max_connections`? Each replica opens both pools; see
   [Sizing](/docs/operations#sizing).

**Fix.** Remove the slow query or the lock first. If the load is real, raise
`SPHERICON_DB_MAX_OPEN_CONNS` or `SPHERICON_RIVER_DB_MAX_CONNS` and make sure the sum over all replicas stays below the
server's `max_connections`; beyond that, add a connection pooler. `SPHERICON_DB_MAX_IDLE_CONNS` must not
exceed `SPHERICON_DB_MAX_OPEN_CONNS`.

## SphericonDBPoolWaits

**Means.** More than 100 times in 15 minutes a request or worker had to wait for a free
connection (`db_sql_connection_wait_total`, either pool). Unlike saturation this catches short, repeated
stalls.

**Check and fix.** The same as [`SphericonDBPoolSaturated`](#sphericondbpoolsaturated). Waiting
that continues while `db_sql_connection_open{status="inuse"}` is well below
`db_sql_connection_max_open` points at slow connection
establishment (network, TLS, a pooler) instead of a too-small pool.

## SphericonEmailSendErrorsHigh

**Means.** More than 10% of send attempts through a provider (`smtp` or `ses`) failed for 15
minutes. These are failures to hand a message to the provider, not bounces.

**Check.**

1. The send error in the logs of the `river job errored` lines for the send jobs: credentials
   revoked, a provider outage, throttling, an unverified sender or sending domain.
2. For SES, check the AWS account status (sandbox, suspended sending, quota) and region.
   For SMTP, check the relay's status page and your credentials.
3. Is it one Workspace? Provider credentials are per Workspace, so a single wrong credential
   fails only that Workspace's sends.

**Fix.** Rotate or correct the credentials in the Workspace's integration settings, wait out a
provider incident, or request a higher quota. Sends run as jobs and are retried within their attempt limit; check
[`SphericonJobFailureRatioHigh`](#sphericonjobfailureratiohigh) for anything that was discarded.

## SphericonEmailBounceRateHigh

**Means.** More than 5% of the messages a provider accepted in the last hour bounced, with at
least 100 accepted. High bounce rates damage sender reputation and can get an SES account
placed under review.

**Check.**

1. Which Workspace? The metric is instance-wide; the per-Workspace bounce rate is on the
   Workspace dashboard ([ADR 0011](https://github.com/getsphericon/sphericon/blob/main/docs/adr/0011-deliverability-rate-metrics.md)).
2. A recent import of an old or purchased list is the usual cause. Permanent bounces are
   added to the suppression list automatically, but the damage is done by the first send.
3. Confirm the suppression consumer is keeping up: its jobs run in the `events` queue
   ([`SphericonJobQueueBacklog`](#sphericonjobqueuebacklog)); if it lags, bouncing addresses stay
   sendable.

**Fix.** Pause the offending broadcast, clean the list, and re-send only to verified
addresses. Talk to the Workspace owner if the source of the list is the problem.

## SphericonEmailComplaintRateHigh

**Means.** More than 0.1% of the messages a provider accepted in the last hour drew a spam
complaint, with at least 1,000 accepted. This is the most damaging deliverability signal: SES
reviews accounts above roughly this rate, and mailbox providers start filtering.

**Check.**

1. Which Workspace and which broadcast? Use the Workspace dashboard
   ([ADR 0011](https://github.com/getsphericon/sphericon/blob/main/docs/adr/0011-deliverability-rate-metrics.md)).
2. Is the unsubscribe link working? The one-click unsubscribe headers
   ([ADR 0012](https://github.com/getsphericon/sphericon/blob/main/docs/adr/0012-bulk-sender-compliance-one-click-unsubscribe.md))
   must be present and the link reachable, or people use the spam button instead.
3. Is the list opted in? Mail to people who never asked draws complaints.

**Fix.** Stop the offending broadcast now. Complaining addresses are suppressed automatically;
confirm that the `events` queue is current ([`SphericonJobQueueBacklog`](#sphericonjobqueuebacklog)). Fix the source of the audience or the
unsubscribe flow before sending again, and respond to the provider if they open a review.
