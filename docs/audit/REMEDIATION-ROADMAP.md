# REMEDIATION ROADMAP

Derived from gaps, **not** a predetermined PROD-00–15 list. **Not authorized to implement.**

| ID | Depends on | Why required | Current gap | Target | Verification | Blocking |
|---|---|---|---|---|---|---|
| R-01 | — | Stop shipping binaries | `server.exe` in git | remove + gitignore | `git ls-files` | P0 hygiene |
| R-02 | owner | Single certification register | conflicting Phase 03/04/06 docs | one DECLARED vs VERIFIED table | this audit + owner sign-off | governance |
| R-03 | Windows host | Close OAuth | callback/connect contradiction | Callback 200 with `X-Agbofa-RPC=Callback`, row in `social_connections` | host evidence SHA-bound | P0 social |
| R-04 | R-03 | Real distribution | no provider id | YouTube unlisted id, never invented | API + DB | P0 publish |
| R-05 | R-04 | Phase 04 real path | worker unproven here | schedule→tick→provider→audit | integration | P0 |
| R-06 | Postgres | Tenant isolation | RLS unproven here | tenant A cannot read B | HTTP tests | P1 |
| R-07 | — | BFF session integrity | unsigned decode | verify JWT or server session | tests | P1 |
| R-08 | — | CSRF on cookie mutations | unused helper | verify header | tests | P1 |
| R-09 | deploy | Auth abuse | in-memory limit | shared limiter | 429 under load | P1 |
| R-10 | — | Contract truth | proto/JSON drift | generate or delete proto claims | CI | P1 |
| R-11 | product | Simulation honesty | many DEMO domains | keep labels or implement | UI audit | P2 |
| R-12 | R-03–R-10 | Autonomy | no runtime/tools/quotas | agent identity + tool allowlist + policy on every side effect + cost deny | Layer 7 re-audit | P0 autonomy |
| R-13 | R-12 | HITL | override UI simulated | real approve/cancel/kill on all execute paths | tests | P0 autonomy |

**Recommended next phase (authorization required):**
not Phase 08 implementation. Owner should authorize **remediation of P0/P1 (R-01–R-10)** as a maintenance/security track, then re-audit. Do **not** start agent implementation.

Items requiring **explicit owner authorization** before any code change:

- Remove `server.exe`
- Reconcile certification language
- OAuth/debug on developer host
- BFF security changes
- Any autonomy/agent work
- Deleting or implementing empty microservices
