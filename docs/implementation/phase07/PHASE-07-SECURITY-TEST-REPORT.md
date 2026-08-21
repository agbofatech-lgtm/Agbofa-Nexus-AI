# PHASE 07 SECURITY TEST REPORT

Command:

```text
node --experimental-strip-types --test apps/web/lib/autonomy-control/plane.test.ts
```

Result: **19 pass / 0 fail** (Arena Node v22.22.3). Log: `docs/audit/PHASE-07-GATE5-NODE-TEST.txt`

| Attempt | Expected | Result |
|---|---|---|
| INVALID AGENT | DENIED | PASS (unit) |
| DISABLED AGENT | DENIED | PASS (unit) |
| UNAUTHORIZED AGENT (READER) | DENIED | PASS (unit) |
| Cross-tenant resolve/get | DENIED | PASS (unit) |
| UNKNOWN TOOL | DENIED | PASS (unit) |
| UNAUTHORIZED TOOL | DENIED | PASS (unit) |
| WRONG TENANT on tool input | DENIED | PASS (unit) |
| FORBIDDEN: oauth/db/shell/social/bypass_* | DENIED | PASS (unit) |
| Publish without truth | DENY TRUTH_REQUIRED | PASS (unit) |
| Publish without compliance | DENY COMPLIANCE_REQUIRED | PASS (unit) |
| Publish without brand | DENY BRAND_REQUIRED | PASS (unit) |
| Kill switch ON | BLOCKED | PASS (unit) |
| Unauthorized kill mutation | DENIED | PASS (unit) |
| Self-approval HIGH | DENIED | PASS (unit) |
| Unauthorized approver | DENIED | PASS (unit) |
| Mutated action after approval | REAPPROVAL_REQUIRED | PASS (unit) |
| Expired approval | DENIED | PASS (unit) |
| Memory privilege phrases | DENIED | PASS (unit) |
| Memory cross-tenant | DENIED | PASS (unit) |
| Budget exhaust | BLOCKED | PASS (unit) |
| Rate exceed | THROTTLED | PASS (unit) |
| Recursion depth | RUNAWAY | PASS (unit) |
| Secret in audit | redacted | PASS (unit) |
| Default production autonomy | false | PASS (unit) |

`go test ./libs/go/pkg/autonomy/`: **BLOCKED** (no Go in Arena).

HTTP adversarial tests against foundation: **BLOCKED** (no `go run`, no Postgres).

RLS two-tenant: **BLOCKED** (no PostgreSQL).
