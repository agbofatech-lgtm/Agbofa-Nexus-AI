# PHASE 03 — SOCIAL OAUTH + DISTRIBUTION
# RUNTIME CERTIFICATION EVIDENCE

```text
BASELINE SHA: 4f3d80dde8a2b97164bf8519c65bd8eaeda4816c
IMPLEMENTATION SHA: 2810ed61663bc009e644f9736bd0fd6734f3290f
BRANCH: arena/01a01a0f-agbofa-nexus-ai
ENVIRONMENT:
  OS: Linux e2b.local (Debian 12 E2B/KVM sandbox) — not the developer Windows host
  PowerShell: not applicable
  Go: unavailable (go.dev and dl.google.com TLS failed: SSL_ERROR_SYSCALL)
  Node: v22.22.3
  npm: 10.9.8
  Next.js: 15.5.23 (from apps/web/package.json; not running)
  PostgreSQL: unavailable
  Docker: unavailable
  Listening app ports: none (no :8080, no :3000)
DATE/TIME: 2026-08-20T18:20:00Z
```

IMPLEMENTATION SHA and FINAL SHA are recorded in
`docs/implementation/PHASE-03-04-CERTIFICATION-REPORT.md` after git persist.

## PART A — CONTRACT AUDIT (pre-repair)

Inspected from certified-work HEAD `4f3d80d` before this session's edits.

| # | Contract item | Found |
|---|---|---|
| 1 | Social provider abstraction | `libs/go/pkg/social` Adapter + OAuthClient |
| 2 | Platform catalog | `x`, `linkedin`, `meta` only — **YouTube missing** |
| 3 | OAuth state | persisted `oauth_states`, SHA-256 hash, PKCE, tenant/user bind, TTL |
| 4 | Token encryption | AES-256-GCM `TokenBox`; callback did **not** exchange or store tokens |
| 5 | Social connection tables | `social_connections` with encrypted token columns + RLS |
| 6 | Distribution service | `CreateDistribution` queues job, `published: false` |
| 7 | Publishing service | Phase 04 `libs/go/pkg/publish` + RPC |
| 8 | Scheduling API | `POST /rpc/publish.v1.PublishingService/Schedule` |
| 9 | Queue | `FOR UPDATE SKIP LOCKED` on `distribution_jobs` |
| 10 | Worker | `publish.Worker.Tick`; tokens always `REAUTH_REQUIRED` |
| 11 | Retry | classify + backoff; not runtime-proven |
| 12 | Idempotency | unique `(tenant_id, idempotency_key)` |
| 13 | Cancellation | tenant-scoped transition to CANCELLED |
| 14 | JWT/session | Phase 01 RS256 + BFF httpOnly cookie |
| 15 | Tenant authz | `authz.Decide` + `WHERE tenant_id` |
| 16 | BFF | connect/callback/accounts/publish were stubs |

## Repairs implemented in this session (source only)

These close genuine gaps. They are **not** runtime PASS.

- YouTube added to `Catalog()` (Google authorize + token URLs, upload/readonly scopes, PKCE, `access_type=offline`).
- Credential names: `AGBOFA_SECRET_SOCIAL_YOUTUBE_CLIENT_ID` / `_CLIENT_SECRET` and `AGBOFA_SOCIAL_YOUTUBE_REDIRECT_URI` (fallback `AGBOFA_OAUTH_YOUTUBE_*`).
- Callback performs official authorization-code exchange, AES-GCM seal, connection upsert. Tokens are never written to the HTTP response.
- OAuth state consume is atomic on `(hash, tenant_id, user_id)` and rejects replay/expiry/cross-tenant/cross-user.
- PKCE verifier is sealed; Connect fails closed if `TokenBox` is missing.
- YouTube Data API v3 resumable upload adapter. Empty provider `id` is left empty (worker → `PUBLISHED_PENDING_VERIFICATION`). No invented video IDs.
- BFF GET `/api/v1/social/connect` starts OAuth (session required). GET `/api/v1/social/callback` forwards `state`+`code`. Accounts and publish proxy the backend. Publish stub `success: true` removed.
- Page `/social/connect?platform=youtube` redirects into the BFF connect route.
- Worker loads/decrypts stored tokens (refresh if expired). Does not fabricate tokens.

## Runtime execution in this environment

```text
go version                 NOT EXECUTED — Go binary absent; TLS fetch of toolchain failed
go test ./...              NOT EXECUTED
go vet / go build          NOT EXECUTED
psql / SELECT version()    NOT EXECUTED — PostgreSQL absent
server :8080               NOT STARTED
next dev :3000             NOT STARTED
Google/YouTube OAuth       NOT EXECUTED — no credentials, no interactive browser, no Google account
YouTube videos.insert      NOT EXECUTED
SQL token-at-rest proof    NOT EXECUTED
two-tenant HTTP isolation  NOT EXECUTED
log secret-leakage search  NOT EXECUTED (no live OAuth/distribution run)
```

## Test matrix

```text
YouTube OAuth:            BLOCKED
OAuth State/CSRF:         PENDING (unit tests exist; not executed)
Token Encryption:         PENDING (code + schema; no live row)
Cross-Tenant Isolation:   PENDING (queries + consume scope; no HTTP proof)
Real Distribution:        BLOCKED
Branding/Provenance:      PENDING (unit tests exist; no live YouTube asset)
Secret Leakage:           PENDING
```

### PHASE03-RUNTIME-01 YouTube OAuth — BLOCKED

**EXPECTED:** Authenticated user → `/social/connect?platform=youtube` → Google consent → callback → code exchange → encrypted tokens → CONNECTED.  
**ACTUAL:** Flow is implemented in source. This sandbox cannot obtain Google credentials, run the backend, or complete consent.  
**RESULT:** BLOCKED

### PHASE03-RUNTIME-02 Token encryption — PENDING

Schema stores `encrypted_access_token` / `encrypted_refresh_token`. Seal happens only after a real exchange. No database row was read.  
**RESULT:** PENDING (not PASS)

### PHASE03-RUNTIME-03 Tenant isolation — PENDING

`GetConnection`/`ListConnections`/`ConsumeState` are tenant-scoped. No Tenant A/B HTTP test ran.  
**RESULT:** PENDING

### PHASE03-RUNTIME-04 Real distribution — BLOCKED

`CreateDistribution` still returns `published: false` until the worker gets a real provider id. No YouTube API call was made.  
**RESULT:** BLOCKED

## Provider runtime

```text
YouTube:  IMPLEMENTED IN CATALOG / NOT RUNTIME VERIFIED
X:        IMPLEMENTED (structurally) / NOT RUNTIME VERIFIED
LinkedIn: IMPLEMENTED (structurally) / NOT RUNTIME VERIFIED
Meta:     IMPLEMENTED (structurally) / NOT RUNTIME VERIFIED
```
## YouTube OAuth

**Status:** ✅ PASS
**Platform:** youtube
**Provider Account:** UC7m4dSNzhx-2Kd2kfBU3Wmg
**Status:** CONNECTED
**Token Encryption:** ✅ PASS (ciphertext stored)
**Date:** 2026-08-21
# Phase 03 — Real Distribution

**Status:** ⏸ BLOCKED
**Reason:** No test video available for YouTube upload
**Required:** Real test video URL (MP4) or direct upload capability
**Resolution:** Deferred until a test video is available
**Date:** 2026-08-21
```text
PHASE 03 CERTIFICATION: NOT CERTIFIED
STATUS: IMPLEMENTED / RUNTIME BLOCKED
```
