# Phase 09 — Gate 1 Forensic Audit: Rate Limiting & Production Readiness

## Scope

Read-only forensic audit of the current implementation surface for:

- rate limiting
- throttling
- quotas and budgets
- workers and queues
- concurrency and backpressure
- retries
- timeouts and cancellation
- idempotency
- BFF/API middleware
- agent execution
- tool execution
- external platform calls

Inspected runtime surfaces:

- `apps/web/app/api/v1/**`
- `apps/web/lib/bff/**`
- `services/foundation/internal/server/**`
- `services/foundation/internal/handlers/**`
- `services/foundation/internal/repositories/**`
- `libs/go/pkg/llm/**`
- `libs/go/pkg/publish/**`
- `libs/go/pkg/social/**`
- `libs/go/pkg/autonomy/**`
- `libs/go/pkg/database/**`
- `services/foundation/migrations/**`

## Executive summary

The codebase already preserves critical security and tenancy controls, and it has partial local throttling at the Next.js BFF plus durable idempotency for distribution jobs in PostgreSQL. However, the authoritative backend (`services/foundation`) currently has **no ingress rate-limit middleware**, and several important runtime protections remain **process-local only**.

The highest-risk gaps are:

1. **Backend RPC ingress is unthrottled** even for AI completion, publishing, autonomy execution, OAuth connect, and worker tick.
2. **BFF throttling is only process-local** and explicitly not safe for horizontal scale.
3. **Autonomy execution limits are in-memory only** and therefore non-distributed.
4. **Publishing worker retry timing is hard-coded** to 30 seconds and does not use the existing exponential backoff helper or provider `Retry-After` semantics.
5. **Publishing worker execution is coupled to the client request context**, which can strand leased jobs if the request is canceled or times out before state is persisted.
6. **LLM usage is recorded after the fact**, but no preflight quota/budget admission control exists.

## Architecture reality map

### Authoritative runtime path

1. Browser calls Next.js route handlers under `apps/web/app/api/v1/**`.
2. Those handlers forward to the Go foundation service using `backendRPC()` or `sessionRPC()`.
3. The Go foundation server authenticates, authorizes, and executes the real runtime logic.
4. PostgreSQL persists tenancy, queue, OAuth, publishing, and autonomy state.

### Important distinction

The TypeScript control-plane harness in `apps/web/lib/autonomy-control/plane.ts` contains its own in-memory rate, budget, and concurrency behavior, but the BFF API routes call backend RPC endpoints instead of this TS plane. It is therefore **not the authoritative enforcement layer** for production runtime requests.

## Preserved strengths

These controls are present and must be preserved:

- JWT verification and authn fail-closed behavior in foundation middleware.
- RBAC authorization checks on backend handlers.
- PostgreSQL tenant isolation with RLS on core domain tables.
- Durable OAuth state/PKCE replay protection.
- Durable DB-backed idempotency for distribution jobs.
- Publishing validation gates for permission, tenant ownership, brand, and platform constraints.
- Production autonomy remains disabled by default and in API responses.
- Database query timeouts and basic graceful shutdown exist.

## Findings

### RL-01 — BFF rate limiting exists, but it is explicitly process-local only

**Severity:** HIGH

Evidence:

- `apps/web/lib/bff/limits.ts` states: `Process-local limiter. Multi-instance / serverless horizontal scale is NOT covered`.
- `apps/web/lib/bff/limits-core.ts` stores counters in a local `Map`.

Impact:

- Multiple app instances can each accept the full limit.
- Limits reset on process restart.
- This cannot be claimed as distributed enforcement.

### RL-02 — BFF route coverage is incomplete and inconsistent

**Severity:** HIGH

Protected today:

- login
- AI complete
- social connect (GET helper path)
- distribution create
- social publish
- publishing schedule

Unprotected today at the BFF:

- publishing approve
- publishing cancel
- publishing tick
- social connect POST
- autonomy execute
- autonomy approval, control, policy, memory, scenario, agent enable, kill-switch, level changes
- various read endpoints that may still drive backend load

Evidence:

- Protected imports/calls: `apps/web/app/api/v1/auth/login/route.ts`, `ai/complete/route.ts`, `social/connect/route.ts`, `distribution/create/route.ts`, `social/publish/route.ts`, `publishing/schedule/route.ts`.
- Missing protection: `publishing/approve/route.ts`, `publishing/cancel/route.ts`, `publishing/tick/route.ts`, `autonomy/execute/route.ts`, and sibling autonomy routes.

Impact:

- High-cost or high-impact mutation routes can be spammed through the BFF.
- Protection policy is currently route-by-route and easy to miss.

### RL-03 — The backend foundation service has no ingress rate-limit middleware

**Severity:** CRITICAL

Evidence:

- `services/foundation/internal/server/http.go` wires authentication, correlation, recovery, and authorization middleware only.
- No backend HTTP middleware or handler-level limiter exists for AI, publishing, autonomy, or OAuth RPC endpoints.

Impact:

- Any direct caller that can reach foundation bypasses BFF-local limits completely.
- There is no authoritative server-side rate decision.

### RL-04 — BFF/backend forwarding has timeouts, but upstream fetch failures are not normalized

**Severity:** MEDIUM

Evidence:

- `apps/web/lib/bff/backend.ts` uses `AbortSignal.timeout(timeoutMs)`.
- `apps/web/lib/bff/backend.ts` does not catch `fetch()` exceptions.
- `apps/web/lib/bff/session.ts` and route handlers assume `backendRPC()` resolves successfully.

Impact:

- Network failures and timeouts can escape as unhandled route errors instead of deterministic `502/504` responses.
- Operational behavior is harder to reason about under stress.

### RL-05 — LLM gateway has retries and timeouts, but no quota admission control

**Severity:** HIGH

Evidence:

- `libs/go/pkg/llm/gateway.go` has request validation, default timeout (`30s`), and retries (`2`).
- `services/foundation/internal/app/compose.go` records usage into `ai_usage_ledger` after calls.
- No preflight quota/budget check is performed before provider execution.

Impact:

- Estimated cost is observable after the call, but not enforced before the call.
- A tenant can consume resources until downstream provider throttles or internal budgets are exceeded elsewhere.

### RL-06 — Publishing queue is durable and idempotent, which is good

**Severity:** POSITIVE CONTROL

Evidence:

- `services/foundation/migrations/20260820120000_phase03_social.up.sql` defines `UNIQUE (tenant_id, idempotency_key)` on `distribution_jobs`.
- `services/foundation/internal/handlers/social.go` and `publishing.go` compute deterministic idempotency keys.
- Duplicate inserts return `idempotent: true` instead of pretending success.

Impact:

- Duplicate publish/schedule requests are already materially safer than the autonomy execution path.

### RL-07 — Autonomy execution idempotency, budget, rate, and concurrency are process-local only

**Severity:** HIGH

Evidence:

- `libs/go/pkg/autonomy/control.go` stores state in in-memory maps: `idem`, `spend`, `rate`, `running`, `execs`, `approvals`.
- `NewPlane()` initializes defaults in memory with `maxConcurrent: 2`, `budget: 100000`, `ratePerMin: 20`.
- `Execute()` enforces concurrency/idempotency in memory only.
- The `agent_executions` table exists in migrations, but handler/runtime execution snapshots are not persisted there.

Impact:

- Limits disappear on restart.
- Two service instances can both accept the same tenant workload.
- Autonomy execution idempotency cannot be claimed as distributed.

### RL-08 — Publishing worker retry policy ignores the existing backoff helper and provider wait hints

**Severity:** HIGH

Evidence:

- `libs/go/pkg/publish/policy.go` defines `Backoff(attempt, retryAfter)`.
- `services/foundation/internal/repositories/queue.go` hard-codes `next_attempt_at = now() + interval '30 seconds'`.
- `libs/go/pkg/publish/worker.go` classifies retryable/rate-limited failures, but it does not pass a computed retry delay into persistence.

Impact:

- 429s and transient platform failures are retried with a fixed delay, regardless of actual provider guidance.
- Existing backoff logic is not being used where it matters.

### RL-09 — Worker execution is coupled to request cancellation

**Severity:** HIGH

Evidence:

- `services/foundation/internal/handlers/publishing.go` calls `h.Worker.Tick(r.Context())`.
- `libs/go/pkg/publish/worker.go` uses the supplied context for `Claim`, token load, provider publish, and `Complete`.
- `apps/web/app/api/v1/publishing/tick/route.ts` gives the BFF call a `120000` ms timeout.

Impact:

- If the client disconnects or the BFF times out, the backend request context can be canceled mid-publish.
- `Complete()` then also runs on the canceled context and may fail to clear the lease or persist the final status.
- This can leave jobs stranded until lease expiry.

### RL-10 — Queue concurrency is durable for claim/lease, but only one job is processed per tick

**Severity:** MEDIUM

Evidence:

- `services/foundation/internal/repositories/queue.go` uses `FOR UPDATE SKIP LOCKED` for claiming jobs.
- `libs/go/pkg/publish/worker.go` processes a single claimed job per `Tick()` invocation.

Impact:

- Durable claim semantics are good for correctness.
- Throughput is limited and backpressure depends on repeated external tick calls.
- There is no bounded background worker loop in the current process.

### RL-11 — Backend health/readiness are minimal and do not expose queue or limiter state

**Severity:** MEDIUM

Evidence:

- `services/foundation/internal/server/http.go` exposes `/healthz` and `/readyz` only.
- Readiness checks database ping only.

Impact:

- No visibility into queue backlog, stuck leases, limiter store health, budget exhaustion, or provider readiness.

### RL-12 — Database query timeout is present and should be preserved

**Severity:** POSITIVE CONTROL

Evidence:

- `libs/go/pkg/database/pool.go` wraps queries with the configured query timeout.
- `config.Load()` defaults `DATABASE_QUERY_TIMEOUT` to `5s`.

Impact:

- Database calls already have a hard upper bound.
- This is a useful foundation for Gate 6 and must not be weakened.

### RL-13 — Graceful shutdown exists, but worker cancellation strategy is incomplete

**Severity:** MEDIUM

Evidence:

- `services/foundation/cmd/server/main.go` uses signal handling and `srv.Shutdown()` with a `10s` timeout.
- No dedicated worker draining/lease handoff logic exists.

Impact:

- HTTP server shutdown is orderly.
- In-flight publish work can still be lost or left leased if it is tied to request contexts.

### RL-14 — Production autonomy remains disabled and clearly signaled

**Severity:** POSITIVE CONTROL

Evidence:

- `libs/go/pkg/autonomy/control.go` initializes `Production: false`.
- `services/foundation/internal/handlers/autonomy.go` returns `production_autonomy: false` in runtime responses.

Impact:

- Phase 09 work must preserve this exact safety posture.

## Area-by-area current state

| Area | Current state | Assessment |
|---|---|---|
| BFF rate limiting | Process-local per-process map keyed by JWT subject or anon UA | Partial only |
| Backend API ingress | No rate limiting | Critical gap |
| Distributed enforcement | Only queue/idempotency are DB-backed | Incomplete |
| AI quotas/budgets | Usage ledger only, post-call | Gap |
| Worker retries | Retry classification exists | Delay persistence gap |
| Worker timeouts | Adapter HTTP client timeout exists | Request-coupled cancellation gap |
| Queue concurrency | Lease/claim via DB | Correct but low-throughput |
| Autonomy concurrency | In-memory running-count limit | Non-distributed |
| Autonomy idempotency | In-memory execution map | Non-distributed |
| Publishing idempotency | DB unique key | Good |
| Health/readiness | Health + DB ping | Minimal |
| Metrics/observability | Logs/audit only | Minimal |

## Phase 09 audit conclusion

The repository has a solid correctness/security baseline for identity, authorization, RLS, brand/truth/compliance gating, and durable publishing idempotency. The main Phase 09 task is therefore **not inventing new security rules**, but making rate limiting and runtime protection **authoritative, durable, and observable at the backend**.

## Required next steps

1. Gate 2: finalize an authoritative design for backend-enforced, PostgreSQL-backed rate limiting.
2. Gate 3–4: implement backend middleware and storage before relying on BFF-local throttles.
3. Gate 5–7: add real budget admission control, request-independent worker timeout handling, and bounded backpressure.
4. Gate 8: preserve DB-backed publishing idempotency and close the autonomy execution persistence/idempotency gap.
5. Gates 9–12: expose health, limiter, queue, retry, and budget telemetry without weakening existing auth/RLS controls.