# PHASE 04 — PUBLISHING PIPELINE
# RUNTIME CERTIFICATION EVIDENCE

```text
BASELINE SHA: 4f3d80dde8a2b97164bf8519c65bd8eaeda4816c
PHASE 04 CODE (prior): 041d58c08751783d51f985de1bddd8652dbfed4b
BRANCH: arena/01a01a0f-agbofa-nexus-ai
OS: Linux e2b.local (Debian 12 E2B/KVM) — not developer Windows
Go: unavailable
Node: v22.22.3
PostgreSQL: unavailable
DATE/TIME: 2026-08-20T18:20:00Z
```

Phase 03 runtime remains **BLOCKED**. Phase 04 certification therefore remains **BLOCKED**.

## Pipeline (implemented, not runtime-proven)

```text
CONTENT → APPROVAL → SCHEDULE → QUEUE → WORKER → PROVIDER → VERIFY → FINAL STATUS
```

| Step | Implementation | Runtime this session |
|---|---|---|
| D1 Schedule | `PublishingService/Schedule` + BFF `/api/v1/publishing/schedule` | NOT EXECUTED |
| D2 Queue | `QUEUED` / `RETRY_WAITING`, `FOR UPDATE SKIP LOCKED`, tenant-scoped claim | NOT EXECUTED |
| D3 Worker | `Tick` uses Phase 03 adapter router + decrypted connection tokens | NOT EXECUTED |
| D4 Real publication | YouTube adapter calls Data API v3; empty id → `PUBLISHED_PENDING_VERIFICATION` | BLOCKED |
| D5 Idempotency | unique idempotency key; skip if `platform_publication_id` set | unit source only |
| D6 Retry | classify + backoff; max attempts → `DEAD_LETTER` | unit source only |
| D7 Cancel | tenant-scoped; worker does not claim CANCELLED | NOT EXECUTED |
| D8 Tenant isolation | claim/due/get/cancel require caller tenant | NOT EXECUTED |

## Worker token loading

Previously the worker always returned `REAUTH_REQUIRED` (intentional until exchange existed).

Now it decrypts `social_connections` tokens for the job's tenant+account. If no connection, decrypt failure, or refresh failure: `REAUTH_REQUIRED`. It does **not** invent access tokens or platform IDs.

Without a live OAuth connection this still cannot publish.

## BFF

- `/api/v1/publishing/schedule` (existing proxy)
- `/api/v1/publishing/cancel` (existing proxy)
- `/api/v1/publishing/approve` (added proxy)
- `/api/v1/publishing/tick` (added proxy, 120s timeout for real upload)
- `/api/v1/publishing/get` (added proxy)

No BFF route returns `PUBLISHED` without a backend/provider result.

## Commands not executed

```text
go test ./libs/go/pkg/publish/...     NOT EXECUTED
go test ./libs/go/pkg/social/...      NOT EXECUTED
go test ./services/foundation/...     NOT EXECUTED
go vet ./...                          NOT EXECUTED
go build ./services/foundation/cmd/server  NOT EXECUTED
```

Integration tests (`AGBOFA_TEST_DATABASE_URL`) fail closed when the URL is missing; they were not run.

## Real publication

```text
internal job ID:        n/a
platform:               youtube
provider video ID:      n/a — no YouTube API call
status:                 n/a
```

A generated id such as `video-${Date.now()}` was not used. The adapter refuses to invent ids.

```text
PHASE 04 CERTIFICATION: NOT CERTIFIED
STATUS: IMPLEMENTED / RUNTIME BLOCKED
REAL PLATFORM: BLOCKED
```
