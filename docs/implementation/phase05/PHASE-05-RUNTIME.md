# PHASE 05 — RUNTIME

```text
BASELINE SHA: 0dbb062b0ccb7f5326a3bdefaef8759f0432ddaa
BRANCH: arena/01a01a0f-agbofa-nexus-ai
OS: Linux e2b.local (Arena) — not developer Windows
Go: unavailable
PostgreSQL: unavailable
```

NO FABRICATED PASS. Arena cannot run `go test`, `go build`, or Windows PowerShell against `:8080`.

## TEST MATRIX

| ID | Result |
|---|---|
| P05-R01 Control Center | IMPLEMENTED / NOT EXECUTED |
| P05-R02 Levels 0–5 persist | IMPLEMENTED / NOT EXECUTED |
| P05-R03 Domain isolation | IMPLEMENTED / NOT EXECUTED |
| P05-R04 Policy create | IMPLEMENTED / NOT EXECUTED |
| P05-R05 AWAITING_APPROVAL | IMPLEMENTED / NOT EXECUTED |
| P05-R06 Approve/reject/cancel | IMPLEMENTED / NOT EXECUTED |
| P05-R07 Run SIMULATION label | IMPLEMENTED / NOT EXECUTED |
| P05-R08 Deterministic fingerprint | unit source / NOT EXECUTED |
| P05-R09 Memory create | IMPLEMENTED / NOT EXECUTED |
| P05-R10 Memory retrieve | IMPLEMENTED / NOT EXECUTED |
| P05-R11 Memory privilege DENIED | unit source / NOT EXECUTED |
| P05-R12 Scenarios PROJECTED | IMPLEMENTED / NOT EXECUTED |
| P05-R13 Actual vs projected | labeled PROJECTED / NOT EXECUTED |
| P05-R14 AI cost ESTIMATED | ledger + registry / NOT EXECUTED |
| P05-R15 Routing ESTIMATED | catalog / NOT EXECUTED |
| P05-R16 Cost-aware strategies | HIGH_QUALITY/BALANCED/LOW_COST / NOT EXECUTED |
| P05-R17 Tenant isolation | RLS / NOT EXECUTED |
| P05-R18 Authorization | authz / NOT EXECUTED |
| P05-R19 Kill switch | persisted ENGAGED / NOT EXECUTED |
| P05-R20 Secret leakage | NOT EXECUTED |
| P05-R21 Audit | autonomy_audit / NOT EXECUTED |
| P05-R22 Restart persistence | schema / NOT EXECUTED |
| P05-R23 UI/backend | kill-switch BFF / NOT EXECUTED |
| P05-R24 Phase 04 boundary | Schedule gated / NOT EXECUTED |
| P05-R25 Brand | existing BrandApplied / NOT EXECUTED |

Phase 03 YouTube publish tests remain **BLOCKED** if required; Phase 05 runs do not call YouTube.

Windows host after pull:

```powershell
go test ./libs/go/pkg/autonomy/ ./libs/go/pkg/authz/
go vet ./libs/go/pkg/autonomy/ ./services/foundation/internal/handlers/ ./services/foundation/internal/app/
go build ./services/foundation/cmd/server
```
