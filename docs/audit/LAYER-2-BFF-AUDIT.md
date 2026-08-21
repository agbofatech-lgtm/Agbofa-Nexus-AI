# LAYER 2 — BFF & Security Boundary

BFF lives inside Next.js `apps/web/app/api/v1`. There is no separate BFF service.

## Verdict

**PARTIAL (real proxy, not a stub; not a complete security gateway).**

## Controls

| Control | Classification | Evidence |
|---|---|---|
| Authentication cookie | EXISTS | `agbofa_session` HttpOnly, SameSite=lax; `secure` only if `AGBOFA_ENV=production` |
| JWT **verification at BFF** | MISSING | `sessionRPC` forwards cookie as Bearer; `/auth/session` **base64-decodes payload without signature check** |
| JWT verification at backend | EXISTS | `authenticate()` → `verifier.Verify()` in `interceptors.go` |
| Authorization at BFF | MISSING | BFF does not call authz; backend `authorize(resource, action)` does |
| CSRF | EXISTS in Go `libs/go/pkg/auth/csrf.go`; **not used by BFF routes** | ORPHANED relative to web |
| Validation | PARTIAL | login uses Zod; many BFF routes pass JSON through |
| Tenant context | BACKEND | JWT tenant + `database.WithTenant` + RLS GUC |
| RPC forwarding | EXISTS | `backendRPC` POST JSON to `AGBOFA_BACKEND_URL` / `BACKEND_URL` / `http://127.0.0.1:8080` |
| Rate limiting | PARTIAL | in-process `Map` in `lib/bff/limits.ts` — not distributed, not on all routes, keyed by `x-forwarded-for` (spoofable) |
| Correlation IDs | BACKEND | `X-Correlation-ID` in interceptors; BFF does not set it |
| Logging | PARTIAL | backend logs method+path without body; BFF no structured audit |
| Secrets in frontend | NOT FOUND in source | provider secrets expected as `AGBOFA_SECRET_*` env on foundation |
| Direct DB from browser | NOT FOUND | |
| Refresh cookie | EXISTS | `agbofa_refresh` set; **no BFF refresh rotation route found** |

## BFF route inventory

Auth, AI, social, distribution, publishing, autonomy (control, kill-switch, level, policy, approval, runs, memory, privilege, scenarios, cost).

Missing vs backend mux: `Disconnect`, `GetTenant`, several autonomy methods may be folded into control/approval routes.

## Classification

REAL: cookie session proxy to foundation
PARTIAL: rate limit, validation, production cookie flags
STUB: no
SIMULATED: frontend pages still fixture-hydrate when BFF 401
ORPHANED: CSRF helper unused by Next routes
