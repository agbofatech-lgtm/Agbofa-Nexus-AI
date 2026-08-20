# PHASE 03 — SOCIAL OAUTH + DISTRIBUTION
# RUNTIME CERTIFICATION EVIDENCE

```text
CURRENT COMMIT: e7dd6edee620f1725c3300c6135531b6662eb589
BRANCH: arena/01a01a0f-agbofa-nexus-ai
REMOTE: e7dd6edee620f1725c3300c6135531b6662eb589 (at inspection start)
ENVIRONMENT:
  OS: Linux e2b.local (Debian 12 E2B/KVM sandbox) — not the developer Windows host
  PowerShell: not applicable
  Go: unavailable
  Node: v22.22.3
  npm: 10.9.8
  Next.js: 15.5.23 (from apps/web/package.json; not running)
  PostgreSQL: unavailable
  Listening app ports: none (no :8080, no :3000)
DATE/TIME: 2026-08-20T08:27:02Z
```

## Previously reported (developer host)

Those results were **not re-executed** in this Arena session against this SHA. They are **not reused as PASS for this certification**.

```text
Backend RPC / Authentication / Argon2id / Database / Frontend Login / BFF / JWT:
NOT RE-EXECUTED HERE
```

## Actual routes discovered (do not assume)

| Capability | Actual route | Behavior observed in source |
|---|---|---|
| OAuth connect (BFF GET) | `/api/v1/social/connect?platform=` | Returns JSON stub `"Connect endpoint is ready"`. **Does not start OAuth.** |
| OAuth connect (backend) | `POST /rpc/social.v1.SocialService/Connect` | Requires auth; body `{platform, redirect_uri}`; builds official authorize URL |
| OAuth callback (BFF) | `GET /api/v1/social/callback` | Forwards `{state}` only; does not send authorization code to a provider |
| OAuth callback (backend) | `/rpc/social.v1.SocialService/Callback` | Validates/consumes state; returns `connected: false`, `PENDING_CODE_EXCHANGE`. **No token exchange.** |
| Accounts | `GET /api/v1/social/accounts` → `POST /rpc/social.v1.SocialService/Accounts` | Lists connections without tokens |
| Distribution create | `POST /api/v1/distribution/create` → `CreateDistribution` | Queues job; response includes `"published": false` |
| Publish stub (BFF) | `POST /api/v1/social/publish` | Returns `{success: true, status: "PENDING"}` **without calling a platform** |

Platform catalog in `libs/go/pkg/social/platform.go`: **`x`, `linkedin`, `meta` only.**  
`Lookup("youtube")` is not defined. There is no Google/YouTube authorize or token URL.

There is **no** `http://localhost:3000/social/connect?platform=youtube` page route.

## Actual schema (from migration `20260820120000_phase03_social.up.sql`)

```text
oauth_states (state_hash, tenant_id, user_id, platform, redirect_uri, pkce_verifier_encrypted, expires_at, consumed_at)
social_connections (encrypted_access_token, encrypted_refresh_token, tenant_id, platform, provider_account_id, status, ...)
distribution_jobs, distribution_attempts, publication_records, distribution_audit
```

SQL was **not executed** (no PostgreSQL).

## NEW RUNTIME TESTS

```text
YouTube OAuth:            BLOCKED
OAuth State/CSRF:         PENDING (unit tests exist; not executed — Go unavailable)
Token Encryption:         PENDING (AES-GCM code exists; no DB query executed)
Cross-Tenant Isolation:   PENDING (RLS + tenant-scoped queries exist; not executed)
Real Distribution:        BLOCKED
Branding/Provenance:      PENDING (unit tests exist; no live publish artifact)
Secret Leakage:           PENDING (no live OAuth/distribution logs in this environment)
```

---

### PHASE03-RUNTIME-01 YouTube OAuth — BLOCKED

**TEST ID:** PHASE03-RUNTIME-01  
**COMMAND:** not executed  
**ACTION:** Inspected catalog and routes; attempted no Google login (no browser, no Google OAuth client, no YouTube in catalog).  
**EXPECTED:** Real YouTube OAuth through to persisted connection.  
**ACTUAL:** Cannot start. Platform `youtube` is absent. Arena has no backend/frontend process and no Google account flow.  
**HTTP STATUS:** n/a  
**RESULT:** BLOCKED  

Blockers:
1. No YouTube adapter / Google OAuth URLs in `Catalog()`.
2. BFF GET connect is a stub, not a redirect to Google.
3. Callback does not exchange an authorization code.
4. This sandbox cannot complete Google authorization.

---

### PHASE03-RUNTIME-02A OAuth state/CSRF — PENDING

**TEST ID:** PHASE03-RUNTIME-02A  
**COMMAND:** `go test ./libs/go/pkg/social/...` — **not executed** (Go unavailable)  
**ACTION:** Source inspection only of `ValidateCallback` (missing/invalid/expired/wrong tenant/wrong user).  
**RESULT:** PENDING  

Source inspection is **not** PASS.

---

### PHASE03-RUNTIME-02 Token encryption — PENDING

**TEST ID:** PHASE03-RUNTIME-02  
**COMMAND:** no SQL executed  
**ACTION:** Schema lists `encrypted_access_token` / `encrypted_refresh_token`. `TokenBox` is AES-256-GCM. No live row was read.  
**RESULT:** PENDING  

---

### PHASE03-RUNTIME-03 Cross-tenant isolation — PENDING

**TEST ID:** PHASE03-RUNTIME-03  
**COMMAND:** not executed  
**ACTION:** `GetConnection`/`ListConnections` filter `tenant_id` from authenticated principal; RLS policies exist. No two-tenant HTTP test was run.  
**RESULT:** PENDING  

---

### PHASE03-RUNTIME-04 Real distribution — BLOCKED

**TEST ID:** PHASE03-RUNTIME-04  
**COMMAND:** not executed  
**ACTION:** Inspected endpoints. `CreateDistribution` persists a job and returns `"published": false`. `/api/v1/social/publish` returns `success: true` with `status: "PENDING"` and does **not** call YouTube.  
**ACTUAL:** No YouTube API request. No platform resource ID.  
**RESULT:** BLOCKED  

A mock/stub `success: true` is **not** real-platform PASS.

---

### Branding — PENDING

Backend `Adapt()` rejects `brand_identity_applied == false` with `BRANDING_REQUIRED`. No live distributed asset was produced.  
**RESULT:** PENDING (cannot exercise on a real YouTube item)

---

### PHASE03-RUNTIME-05 Secret leakage — PENDING

No OAuth/token-exchange/distribution run occurred here, so logs were not searched under load.  
**RESULT:** PENDING  

---

## Provider runtime

```text
YouTube:  NOT IMPLEMENTED IN CATALOG / NOT RUNTIME VERIFIED
X:        IMPLEMENTED (structurally) / NOT RUNTIME VERIFIED
LinkedIn: IMPLEMENTED (structurally) / NOT RUNTIME VERIFIED
Meta:     IMPLEMENTED (structurally) / NOT RUNTIME VERIFIED
```
