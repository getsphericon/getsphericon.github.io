---
title: "Sphericon Roadmap — toward drip.com-level marketing automation"
---

## Context

Sphericon is an open-core marketing automation platform (Go backend + React/Vite frontend,
workspace-scoped multi-tenant). The goal is to incrementally bring the product to the level of
**drip.com**, but as a **general-purpose marketing automation platform** (not the e-commerce-specific
ECRM that drip is — e-commerce is designed-for architecturally and built later).

**Current state (the core is built):**

- Identity per the accepted ADRs: **Contact** is multi-key (subject_id / email / phone, all optional),
  has no `status`/`prospect` flag; **Visitor** resolves to a Contact via **Identify**, which stitches
  earlier anonymous Events; Events attach by stable `contact_id` resolved at ingest (never by email).
  Custom fields (auto-created, typed). Collect API (identify + events). [ADR 0002, 0006]
- **Segment engine** (`internal/segments`): react-querybuilder rules compiled to ent predicates —
  attributes, custom fields, and event-correlation conditions (NOT-EXISTS), with a live preview count.
- **Send-eligibility** (`internal/eligibility`, [ADR 0001]): (channel, destination)-keyed Suppression +
  per-source Unsubscribe, derived (never a contact flag); consulted in every send path; scoped
  unsubscribe links + an "unsubscribe from everything" path.
- **Sending — all three surfaces:** Broadcasts (river engine, open/click/unsub tracking, per-broadcast
  report), Automations (linear send/wait, enroll-once, event-bus triggers, visual xyflow builder),
  Transactional (`/api` send, references a Template, respects Suppression). Templates are HTML
  (Liquid merge tags over email-ready HTML), copied-at-author-time for marketing [ADR 0003].
- **Deliverability so far:** bounce/complaint ingestion (SES-over-SNS hook → Suppression),
  workspace analytics dashboard.
- Infra: river jobs with real handlers; domain events reach each consumer as a river job of its
  own, written in the producer's transaction (ADR 0101; ✅ replaced the watermill outbox).
  Three API surfaces (site/external/collect), scoped API tokens. SMTP/SES integrations
  (encrypted). **Multi-user workspaces** [ADR 0004]: a User reaches a Workspace through a
  Membership (owner / admin / member), with invitations and a members UI; site handlers are
  scoped from the caller's Membership.

**Gaps to reach parity (the big rocks left):** automation branching / goals / per-step conditions,
onsite forms/popups, a visual email editor (ADR 0040), A/B testing, an outbound
SES-compatible send API, more provider adapters (Yandex/SendGrid/…), SMS channel, e-commerce.

For a detailed competitive feature breakdown of drip.com, see
`research/drip-com-feature-analysis.md`. For an
analysis of the incumbent open-source competitor's pain points (Mautic) mapped to Sphericon's
position — and the net-new items it surfaced — see
`research/mautic-pain-points-analysis.md`.

## Guiding principle: lean on maintained libraries

Minimize hand-rolled code. Where popular, **actively maintained** solutions exist, use them. Confirm a
library's maintenance status at `go get` / `pnpm add` time and pick the living variant.

| Task                             | Library (instead of hand-rolling)                                             |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Email templating / merge tags    | **`github.com/osteele/liquid`** (Liquid, like drip); fallback `flosch/pongo2` |
| HTML → plaintext (text part)     | **`github.com/k3a/html2text`** or `jaytaylor/html2text`                       |
| Link rewriting + pixel injection | **`golang.org/x/net/html`** (official parser), not regexes                    |
| Signing tracking tokens          | **JWT** (already a dep via go-pkgz/auth) / `golang-jwt`, not hand-rolled HMAC |
| Send queue / retries             | **river** (already in the repo) — don't write an engine                       |
| Email HTML editor                | **`@mantine/tiptap`** (official Mantine package)                              |
| Passkeys / WebAuthn              | **`github.com/go-webauthn/webauthn`** (go-pkgz/auth does not do WebAuthn)     |
| TOTP two-factor                  | **`github.com/pquerna/otp`** (TOTP + QR provisioning URIs)                    |

## Phased roadmap

Each phase builds on the previous ones. The order is chosen so that the first value (real email sending)
appears quickly, and the largest block (automations) lands on a ready foundation of sending + segments +
tracking.

| Phase     | Block                                | Status           | Depends on | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ------------------------------------ | ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**     | **Broadcasts MVP**                   | ✅ Done          | —          | One-off email campaigns end-to-end + delivery tracking (opens/clicks/unsub) + per-campaign report. Audience = all active contacts (+ rule segment).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **2**     | **Segment engine**                   | ✅ Done          | 1          | react-querybuilder rule definition compiled to an ent predicate (attributes + custom fields **+ event-based conditions** — "performed event X in last N days" via a correlated EXISTS), preview count, usable as broadcast audience.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **3**     | **Email templates + HTML**           | ✅ Done          | 1          | Reusable templates; single body format — **HTML** everywhere (liquid → text), test sends. A visual editor is still to come (ADR 0040; body is an HTML textarea for now).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **4**     | **Automations / Workflows**          | ✅ Done (linear) | 1, 2, 3    | Automation + AutomationRun schema, river-backed engine (trigger → email/wait steps, enroll-once), site CRUD API + UI (list, step editor, activate/deactivate). Triggers fire off the **domain-event bus** (`internal/events`). A visual branch/goal builder (@workflowbuilder/sdk, xyflow) is still to come — steps are a linear list for now.                                                                                                                                                                                                                                                                                                                    |
| **ADR**   | **Identity + eligibility refactors** | ✅ Done          | —          | ADR 0002 (unified Contact identity — multi-key, email optional, events by resolved id, anonymous-event stitching, `prospect` dropped) and ADR 0001 (send-eligibility — no `contact.status`; (channel, destination)-keyed Suppression + per-source Unsubscribe; derived eligibility) are built, wired into every send path, and tested.                                                                                                                                                                                                                                                                                                                            |
| 5         | Forms & onsite                       | ⬜               | 1, 2       | Signup forms/popups, embed, feeding into contacts/events (on top of Collect API + tracker).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 6         | Analytics + deliverability           | 🟡 In progress   | 1, 4       | Dashboards **✅** (workspace analytics overview). Suppression list **✅** (do-not-send registry, consulted in the send loop). Bounce/complaint **ingestion ✅** — inbound hooks at `/hooks/{key}` (ADR 0037: the key belongs to one Integration, which reads its callbacks with a Preset; SES is the `ses` Preset: signature-verified, topic-bound and subscription-confirming) normalizes into typed `EmailBounce`/`EmailComplaint` events → suppression (permanent bounces + complaints). Sending domains + native DKIM **✅** (ADR 0010). Still ⬜: outbound SES-compatible endpoint (extend nikoksr/notify), A/B, more provider adapters (Yandex/SendGrid/…). |
| 7 (later) | E-commerce                           | ⬜               | 2, 4       | Shopify/Woo connectors, product catalog, purchase/cart events, revenue attribution. Enabled architecturally via the events model from Phase 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## Remaining backlog (the foundation is built)

The core model is in place; the open work is feature breadth on top of it:

- **Automation branching / goals / per-step conditions** — the visual builder exists but
  linearizes; the schema + engine model only ordered send/wait steps.
- **Anonymous-Contact promotion policy** — left open by ADR 0002: a Visitor resolves to a
  Contact only via Identify/API/import; whether/when an anonymous Visitor is promoted to a
  Contact row is undecided.
- **SSO/SAML** — EE ([ADR 0014]), on top of Membership.
- **Phase 5 — Forms & onsite popups** — not started.
- **Phase 6 remainder** — outbound SES-compatible send endpoint,
  A/B testing, more provider adapters (Yandex/SendGrid/…). See also **send-rate control &
  IP warmup** below — a deliverability prerequisite that pairs with the (built) sending domains.
- **Phase 3 — visual email editor** (ADR 0040) — the body is still an HTML textarea.
- **SMS channel** — reserved on Integration/Suppression/Unsubscribe; no implementation.
- **Phase 7 — e-commerce** — far future.

### Surfaced by the Mautic pain-point analysis

Three items below are **not** feature-breadth parity — they come from the incumbent
competitor analysis (`research/mautic-pain-points-analysis.md`),
which maps Mautic's most-repeated complaints to Sphericon's position. Most of Mautic's systemic
pains (cron architecture, upgrade friction, Redis/multi-master deployment, dated UI) Sphericon
already neutralises by design; these three are the ones still open for us:

- **Scale validation — highest value.** Sphericon's core bet (live rule segments, membership
  _never materialized_ — `GLOSSARY.md`) structurally avoids Mautic's #1 abandonment cause
  (~1M contacts → 5-minute segment editor, hanging pages, ~4 contacts/sec import), **but it is
  unproven at that scale.** Load-test the segment engine (rule → SQL compile + live preview
  count) and the broadcast send-loop audience resolution at ~1M contacts; deliverable is a
  benchmark plus any indexes/query fixes it exposes. This is the single most impactful item
  for competing against Mautic head-to-head.
- **Send-rate control & IP warmup** — configurable per-provider send rate (emails/sec) and a
  warmup ramp for new IPs/domains. Today only fixed per-queue concurrency exists
  (`internal/jobs/worker.go` — `QueueBroadcasts: {MaxWorkers: 10}`); there is no throttle.
  Lean on **river**'s native rate/concurrency limiting, not a hand-rolled throttler. Builds
  on the sending domains (ADR 0010).
- **Independently-scalable worker tier (process roles)** — deployment topology, _distinct_
  from scale-validation above (that is query cost at 1M contacts; this is throughput
  scaling). **Horizontal scaling already works today:** river distributes job _work_ across
  all clients via `SELECT … FOR UPDATE SKIP LOCKED` (leader only does maintenance), and since
  ADR 0101 every domain-event consumer is a river job too (one per consumer per event, in the
  `events` queue; ✅ done, the watermill-sql consumer groups are gone), so N replicas compete for
  the same jobs — **no double enrollment / duplicate webhook / duplicate send.** It needs no
  Redis (the coordination lives in Postgres — the same anti-Mautic simplicity). The _gap_ is
  that every replica is a full stack (HTTP + jobs, domain events included), so the **worker
  tier cannot be scaled independently of the web tier** — a big broadcast forces more full binaries behind the LB. Fix is a **run-mode
  split**, cheap because the HTTP server and the job workers already start separately
  (`internal/app/app.go`) and it mirrors the existing `migrate` subcommand:
  - `serve` (default, all-in-one) — HTTP + jobs. **Keep this the default** — the
    single-binary + single-Postgres self-host story is a core positioning advantage; splitting
    is opt-in for scale, never required.
  - `worker` — jobs (domain events included), no HTTP; scale this deployment for
    send/automation throughput.
  - `web` — HTTP only, workers not started.
  - Also make river's per-queue `MaxWorkers` (hardcoded 5/10/5 in `internal/jobs/worker.go`)
    config-driven so a worker box can be sized.

  Implementation gotchas to carry into the design (not a distributed-systems project — a
  process-role flag + config):
  - A `web`-only node must build an **insert-capable** river client (`NewClient` +
    `Enqueue*`/`OnEvent`) but **not** call `Start()`. Confirm `app.New`/`register` can wire the
    jobs client without starting workers — startup is currently coupled inside `RunJobs`; that
    decoupling is the one real refactor.
  - **Deploy constraint:** at least one `serve`/`worker` node must run — river needs a started
    client for the leader/scheduler, or enqueued jobs never process (document it).
  - Per-process `MaxWorkers` × replicas is **not** a fleet-wide rate limit. A global emails/sec
    cap needs river's global rate limiting — ties back to the **send-rate control** item above.

### Account security — core, not EE

Authentication hardening is table-stakes, not an enterprise upsell, so these ship in the
AGPL core (only **SSO/SAML** stays the EE line — see the open-core split). Both extend the
current go-pkgz/auth email+password flow, which does neither natively.

- **Two-factor authentication (TOTP)** — opt-in second factor per User: enrol (QR provisioning
  URI + secret), verify at login, recovery codes, disable. Lib: `github.com/pquerna/otp`.
  A User-level concern (2FA travels with the human across every Workspace they reach via
  Membership), not Workspace-scoped.
- **Passkeys (WebAuthn)** — passwordless / phishing-resistant login as an additional
  credential on the same User. Lib: `github.com/go-webauthn/webauthn` (needs a
  `credential`-style table keyed to User; `SPHERICON_APP_URL` origin becomes the WebAuthn RP ID).
  Sequence 2FA first — it establishes the "extra User credential" schema passkeys build on.

### Self-hosting lifecycle — core, not EE

Operating a self-hosted instance over time: knowing an update exists, applying it safely, and
(optionally) telling us how the fleet uses the product. The Release check and the Telemetry
report are two channels (ADR 0032): refusing telemetry does not hide a security release.

- **Release-update notification** (built) — the running instance checks for a newer published
  release and shows every Workspace Owner an in-app banner ("vX.Y is available").
  **Auto-update** is an open, deployment-specific question: reasonable for the single
  **binary** install, wrong for Docker/k8s (you roll a new image — that's watchtower/the
  orchestrator's job, not ours), and risky when a release carries migrations.
- **Update / migration / Postgres runbook** (built) — [Operations: Upgrading](/docs/operations/upgrading)
  keeps two runbooks apart:
  - _App upgrade_ — pull the new image/binary, run `./sphericon migrate` (or `SPHERICON_DB_AUTO_MIGRATE` on a
    single replica), roll servers. Migrations are embedded and forward-only.
  - _Postgres major upgrade_ — a DBA operation (`pg_upgrade` or dump/restore across majors),
    independent of the app release.
- **Usage telemetry (opt-out)** (built) — a daily anonymous Telemetry report. `SPHERICON_MODE`
  decides whether the report and the Release check run at all; `DO_NOT_TRACK=1` switches the
  report off; otherwise a Staff member switches it in the Staff console. See
  [Telemetry and the Release check](/docs/operations/telemetry).
