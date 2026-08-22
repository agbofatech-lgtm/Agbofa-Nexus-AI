# Phase 09 — Gate 2 Design: Authoritative Rate Limiting & Runtime Protection

## Design goals

1. Make rate-limit decisions **authoritative at the backend**, not only at the BFF.
2. Use a **real distributed/shared store** for enforcement.
3. Preserve all existing authn/authz/RLS/tenant-isolation guarantees.
4. Keep **production autonomy disabled**.
5. Ensure rate-limit rejection remains an actual failure (`429`), never a hidden success.
6. Preserve existing durable publish idempotency.
7. Improve timeout, retry, and worker-failure behavior without fabricating performance claims.

## Non-goals

- Do not enable autonomous publishing.
- Do not replace JWT, RBAC, or RLS controls.
- Do not trust arbitrary client identity headers.
- Do not claim Redis- or multi-region-style behavior that is not implemented.

## Authoritative design decision

### Source of truth

The authoritative limiter must live in the Go foundation service.

Reason:

- The BFF is currently process-local only.
- The BFF can be bypassed by direct backend callers.
- The foundation service already owns verified principal identity and tenant context.

### Shared store

Use PostgreSQL as the distributed rate-limit store.

Reason:

- PostgreSQL already exists in the system architecture.
- It is the only durable, shared coordination primitive currently available in this repo.
- Using PostgreSQL is a real distributed implementation, not a fabricated claim.

## Proposed implementation

### 1. Backend limiter table

Add a dedicated table for short-lived counters, for example:

- `scope_key` — route + identity bucket
- `tenant_id` — nullable for anonymous/login buckets, set for authenticated traffic
- `window_start` — normalized minute window
- `hit_count`
- timestamps

Unique key:

- `(scope_key, window_start)`

Behavior:

- On each protected request, atomically upsert the current window row.
- Increment count and reject with `429` if it exceeds the configured limit.
- Return `Retry-After` based on window expiry.

### 2. Identity derivation rules

Never trust raw client identity headers.

Use these keys only:

- authenticated routes: verified JWT subject + tenant + route class
- tenant-control routes: verified JWT subject + tenant + route class
- anonymous login route: route class + normalized request intent (for example tenant name if supplied) + user agent bucket

Do **not** key on `X-Forwarded-For` as the primary identity source.

### 3. Backend route classes

Protect at minimum:

- `AuthenticateUser`
- `AIGateway/Complete`
- `SocialService/Connect`
- `SocialService/Callback`
- `SocialService/CreateDistribution`
- `PublishingService/Schedule`
- `PublishingService/Approve`
- `PublishingService/Cancel`
- `PublishingService/Tick`
- `AutonomyService/Execute`
- `AutonomyService/KillSwitch`
- `AutonomyService/SetLevel`
- `AutonomyService/CreatePolicy`
- `AutonomyService/DecideApproval`
- `AutonomyService/EnableAgent`

Read endpoints may also receive broader limits to protect backend capacity.

### 4. BFF remains defense-in-depth only

Keep the Next.js local limiter, but treat it as an early shedder, not as the authoritative control.

Improvements at the BFF layer:

- cover currently unprotected mutation routes
- normalize `429` responses
- add `Retry-After` header for local rejections
- normalize upstream timeout/fetch failures into deterministic `502/504`

### 5. Worker timeout and cancellation model

Decouple `PublishingService/Tick` work from the client request context.

Proposed behavior:

- handler authenticates and authorizes normally
- handler creates an internal bounded execution context for the tick
- publish/provider calls run on that bounded internal context
- final queue state persistence uses a still-valid internal context, not the canceled client context

This prevents leased jobs from being stranded when the browser/BFF times out.

### 6. Retry persistence

Use the existing `publish.Backoff()` helper when persisting `next_attempt_at`.

Behavior:

- `RETRY_WAITING` must persist a computed retry time based on attempt number
- if provider `Retry-After` is available, prefer it
- do not hard-code every retry to 30 seconds

### 7. Budget and quota admission control

AI cost tracking is already stored in `ai_usage_ledger`, but enforcement is missing.

Phase 09 design:

- add a budget-check step before provider execution
- compute usage from persisted ledger state on a defined window (for example per day/per tenant)
- reject over-budget calls before provider invocation
- record a deterministic budget-denied outcome

This preserves truthful cost accounting and avoids post-facto-only controls.

### 8. Autonomy execution persistence

Close the gap between the in-memory plane and durable execution state.

Design intent:

- persist execution snapshots to `agent_executions`
- persist enough fields to reconstruct rate-limit, approval, and idempotency outcomes
- keep tenant isolation intact
- do not persist secrets or OAuth tokens

This will make autonomy idempotency and audit more durable, though production autonomy remains disabled.

### 9. Health/readiness and observability

Extend observability without weakening security:

- readiness should include limiter store availability if the limiter becomes required for admission
- expose queue/lease health, not secrets
- log rate-limit denials with correlation id, tenant id, subject id, route class, and retry-after
- count limiter denials, worker retries, reauth transitions, dead-letter transitions, and budget denials

### 10. Configuration safety

Introduce explicit configuration for limiter behavior rather than burying values in code.

Examples:

- enable/disable backend limiter
- per-route limits
- time window size
- internal worker tick timeout
- AI budget ceilings

Configuration must fail closed in strict environments when required limiter settings are malformed.

## Proposed gate mapping

| Gate | Planned work |
|---|---|
| 3 | Backend limiter repository + middleware + BFF coverage cleanup |
| 4 | PostgreSQL-backed shared enforcement |
| 5 | AI budget admission checks |
| 6 | Internal worker timeout/cancellation contexts |
| 7 | Backpressure/concurrency hardening |
| 8 | Preserve publish idempotency, improve autonomy execution durability |
| 9–12 | Health/readiness, logs, metrics |
| 13 | Config validation and fail-closed defaults |
| 14+ | Regression/failure injection/runtime evidence |

## Acceptance criteria for implementation

A Phase 09 implementation should only be considered successful if:

1. Backend `429` enforcement works even when callers bypass the BFF.
2. Rate-limit keys are derived from verified identity, not spoofable client headers.
3. Publishing queue retries use persisted backoff rather than a hard-coded delay.
4. Worker completion persists even if the original client request disconnects.
5. Production autonomy is still disabled.
6. Existing authn/authz/RLS/idempotency behavior is preserved.

## Design conclusion

The safest path is:

- **authoritative backend limiter in Go**
- **PostgreSQL as the shared enforcement store**
- **BFF local shedding as secondary protection only**
- **request-independent bounded worker execution for publish ticks**
- **real budget admission control before provider calls**

This is the minimum design that satisfies Phase 09 without inventing infrastructure that does not exist in the repository.