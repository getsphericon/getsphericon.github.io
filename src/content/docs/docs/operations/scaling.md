---
title: "Scaling and tuning"
---

This page covers the connection budget, why a connection pooler in front of Sphericon is not
recommended, and the retention settings that keep the database bounded. All defaults below are
the shipped ones.

## Connection budget

Each replica opens two separate pools to PostgreSQL:

| Variable                         | Default                                | What it bounds                                                                                                                                                             |
| -------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPHERICON_DB_MAX_OPEN_CONNS`    | `15`                                   | The `database/sql` pool: API requests and the database work of the job workers, the domain-event consumers among them.                                                     |
| `SPHERICON_DB_MAX_IDLE_CONNS`    | equal to `SPHERICON_DB_MAX_OPEN_CONNS` | Idle connections kept open. Must be between `0` and `SPHERICON_DB_MAX_OPEN_CONNS`.                                                                                         |
| `SPHERICON_DB_CONN_MAX_LIFETIME` | `30m`                                  | How long a connection is reused before it is recycled.                                                                                                                     |
| `SPHERICON_RIVER_DB_MAX_CONNS`   | `25`                                   | The job queue's (river) own pool: fetch, completion and leader election, plus one `LISTEN` connection outside it. Job workers do their database work through the `database/sql` pool, so it need not match their number. |

Keep the total across all replicas below the server's `max_connections`:

```
(SPHERICON_DB_MAX_OPEN_CONNS + SPHERICON_RIVER_DB_MAX_CONNS + 1) x replicas + ~15% headroom <= max_connections - 3
```

The `- 3` reserves PostgreSQL's superuser slots (`superuser_reserved_connections`, default 3);
the headroom covers backups, `psql` sessions, monitoring and migrations.

With the defaults and two replicas: `(15 + 25 + 1) x 2 = 82`, about `94` with 15% headroom, which
fits under `97` on a server with the stock `max_connections = 100`. The defaults therefore assume
**at most two replicas against `max_connections = 100`**. For more replicas, raise
`max_connections` (each connection costs server memory) or lower the two pool sizes.

## PgBouncer and other poolers

Do not put PgBouncer (or another transaction-pooling proxy) between Sphericon and PostgreSQL. The
job queue (river), which runs the background jobs and the domain events alike, relies on
`LISTEN`/`NOTIFY` to wake workers. Notifications are tied to a session, which a transaction-mode
pooler does not preserve.

If a pooler is unavoidable, use **session** pooling mode only, which keeps one server connection
per client connection. There is no PgBouncer-compatible mode.

## Retention

The data that grows with traffic is the **Event** table. It is pruned in core by a background job.
The policy is [ADR 0019](https://github.com/getsphericon/sphericon/blob/main/docs/adr/0019-event-retention.md).

| Variable                          | Default | `0` means | What it controls                                                                                                                                                                               |
| --------------------------------- | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPHERICON_EVENTS_RETENTION_DAYS` | `400`   | disabled  | Deletes **analytical** Events (opens, clicks, deliveries, customer-tracked actions) older than the window, measured from when the row was inserted. Runs daily at 03:00 UTC, in small batches. |

Negative values are rejected at startup. Deleting an Event is irreversible, so choose the window
deliberately; to keep everything, set `SPHERICON_EVENTS_RETENTION_DAYS=0`.

### What is kept

- **Evidentiary Events are never deleted by age.** These are consent proof
  (`marketing.confirmed`), permanent bounces (`email.bounced` with a permanent bounce kind),
  complaints (`email.complained`) and unsubscribes (`email.unsubscribed`). They are the audit
  and dispute record. Suppression itself does not depend on them: it is a separate registry that
  survives Event deletion.
- **Broadcast reports are unaffected.** They read the Broadcast recipient rollup, not live
  Events, so old campaign results stay readable after their opens and clicks expire.
- **Deliverability rates** (bounce and complaint, ADR 0011) read a short live window, far inside
  the 400-day default.

### Segment look-back cap

A [Segment](/docs/guide/segments) condition that looks back further than the retention window only
sees Events that still exist, so its results are capped by `SPHERICON_EVENTS_RETENTION_DAYS`. For example,
"opened an email in the last 500 days" behaves like "in the last 400 days" on a default
instance. This is a documented product limit, not a bug. Evidentiary Events are exempt from the
deletion, so conditions on them are not capped.

### Job queue retention

River job retention is set explicitly and is not configurable: completed jobs are kept 24 hours,
cancelled jobs 24 hours and discarded (failed for good) jobs 30 days, so the table stays small
and a failure stays long enough to notice, fix and retry. This covers the domain events too: each
consumer of an event gets a job of its own in the `events` queue, and the Event table, not the
queue, is the durable record of what happened.

## Disk

Disk follows the Event rate. With the default window, expect the `events` table to level off at
roughly 400 days of analytical traffic plus all evidentiary Events. Lower `SPHERICON_EVENTS_RETENTION_DAYS`
to cap disk and backup size sooner.
