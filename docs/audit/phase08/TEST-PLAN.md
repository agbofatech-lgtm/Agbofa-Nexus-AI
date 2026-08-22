# Phase 08 verification matrix

- created: 2026-08-22T04:29:00Z
- inspect SHA: 63fa309d547909e70c86d4b4380207b3b3ead363
- branch: arena/01a01a0f-agbofa-nexus-ai
- Phase 07 ancestor 01156da: YES
- environment: Arena Linux (not Windows). Go: NOT AVAILABLE. psql: NOT AVAILABLE. Node: v22.22.3
- Plane.Production default: false
- Plane.Truth / Plane.Compliance: function fields `func(string) (bool, error)`, assigned from DevelopmentTruth.Verify / DevelopmentCompliance.Check
- HTTP: POST /v1/autonomy/execute and RPC Execute exist
- Persistence: `agent_executions` migration exists; handler does not INSERT (in-memory Plane only)

## Dependency order

BUILD → UNIT → POLICY → SECURITY → DATABASE → FOUNDATION → LIVE HTTP → NEGATIVE HTTP → REGRESSION → COVERAGE → EVIDENCE → CERTIFICATION

Do not run live HTTP until BUILD+UNIT+POLICY pass and Foundation can start.

## Upstream blocker found during inspection

`libs/go/pkg/autonomy/control.go` calls `contentText`, `p.evalTruth`, `p.evalCompliance` but those identifiers are **not defined** in the package. Go compilation of autonomy is expected to FAIL until those helpers are restored. This is a code defect, not an environment defect.

---

### A. BUILD / COMPILATION

| Test ID | Purpose | Level | Preconditions | Command | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|---|---|
| B-001 | Go autonomy compile/test | BUILD | go present | `go test ./libs/go/pkg/autonomy` | compile + tests | go missing | BLOCKED (env); compile defect also present | this plan + BASELINE |
| B-002 | Full go test | BUILD | go present | `go test ./...` | all packages | go missing | BLOCKED | |
| B-003 | Missing helpers | BUILD | source inspect | rg contentText/evalTruth | functions exist | **undefined** | FAIL (code) | control.go |

### B. TRUTH ENGINE

| Test ID | Purpose | Level | Command/request | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|---|
| T-001 | safe fixture | UNIT | DevTruthEngine / DevelopmentTruth | true,nil | Node suite | see execution | truth-test.txt |
| T-002 | known false | UNIT | "the earth is flat" | false,nil | | | |
| T-003 | empty | UNIT | "" | false + unavailable | | | |
| T-004 | whitespace | UNIT | "   " | false + unavailable | | | |
| T-005 | deterministic | UNIT | repeat fixture | identical | | | |
| T-006 | nil engine | UNIT | NewPlane Truth != nil; nil eval | unavailable not true | Go test exists, not run | BLOCKED go | |
| T-007/T-008 | error ≠ TRUE | UNIT | unknown claim | false + error | | | |
| T-009 | blocked ≠ TRUE | UNIT | known false | false,nil | | | |
| T-010 | Plane integration | UNIT | validate_facts tool | engine used | Node policy tests | | |

### C. COMPLIANCE ENGINE

| Test ID | Purpose | Level | Expected | Result |
|---|---|---|---|---|
| C-001 | safe fixture | UNIT | true,nil | Node |
| C-002 | prohibited phrase | UNIT | false,nil | Node |
| C-003 | email PII | UNIT | false,nil | Node |
| C-004 | SSN-like | UNIT | false,nil | Node |
| C-005/C-006 | empty/ws | UNIT | unavailable | Node |
| C-007 | deterministic | UNIT | identical | Node |
| C-008/C-009/C-010 | missing/error ≠ compliant | UNIT | BLOCKED | Go + Node |
| C-011/C-012 | Plane + policy | UNIT | fail blocks | Node |

Disclosure: DEVELOPMENT POLICY ENGINE only.

### D. POLICY INTEGRATION

| Test ID | Purpose | Level | Expected |
|---|---|---|---|
| P-001 | both pass | UNIT | continue (publish still needs approval + Production=false → BLOCKED/WAITING) |
| P-002 | truth fail | UNIT | BLOCKED TRUTH_FAILED |
| P-003 | compliance fail | UNIT | BLOCKED COMPLIANCE_FAILED |
| P-004/P-005 | engine error | UNIT | BLOCKED *_UNAVAILABLE |
| P-006/P-007 | missing engine | UNIT | BLOCKED |
| P-008/P-009 | bypass_* | UNIT | FORBIDDEN_TOOL |

### E. AUTHENTICATION

| Test ID | Level | Expected |
|---|---|---|
| A-001 no creds | UNIT httptest + LIVE HTTP | 401 |
| A-002 malformed | UNIT + LIVE | 401 |
| A-003 invalid bearer | UNIT + LIVE | 401 |
| A-004 expired JWT | UNIT (existing jwt.test.ts) | reject |
| A-005 tampered JWT | UNIT jwt.test.ts | reject |
| A-006 test token + PLANE_TEST_AUTH + env test | UNIT | accept |
| A-007 test token + production | UNIT | 401 |
| A-008 production JWT path | UNIT jwt verify | unchanged |

LIVE HTTP rows stay BLOCKED without Foundation.

### F. AUTHORIZATION

Unauthorized agent/tool/forbidden/direct publish: UNIT in plane.test.ts. LIVE: BLOCKED.

### G. TENANT ISOLATION

Cross-tenant Get/resolve: UNIT. RLS two-tenant HTTP: BLOCKED (no Postgres).

### H. KILL SWITCH

SetKill engage → Execute BLOCKED: UNIT. LIVE: BLOCKED.

### I. TOOL PERMISSIONS

FORBIDDEN_TOOLS list including raw_oauth_token: UNIT.

### J. AUTONOMY EXECUTION

Observe AGT-026 succeeds; publish only via Phase04 port; Production false: UNIT.

### K. HTTP API

POST /v1/autonomy/execute: route exists. LIVE: requires go run + Postgres + env. BLOCKED here.

### L. DATABASE / PERSISTENCE

agent_executions table migrated but **handler does not persist snapshots**. Classification: NOT IMPLEMENTED for Execute durability. Do not claim verified persistence.

### M–P. FAILURE / IDEMPOTENCY / AUDIT / SECURITY

Covered by existing Node plane tests (unit). Go equivalents exist, not executed.

### Q. REGRESSION

Node: explicit file list (no glob). Go: BLOCKED.

### R. COVERAGE

`go test -coverprofile=...` BLOCKED. Do not invent percentage.

### S. SECRET EXPOSURE

Review changed files. test-token-123 is explicit non-prod fixture.

### T. PRODUCTION SAFETY

Plane.Production must remain false. No live social publish.

### U. EVIDENCE

Update BASELINE, this plan, truth/compliance/integration/coverage/regression/final/certification with actual commands.

## What this host can run now

Runnable: Node unit tests listed below.
Not runnable: any `go` command, Foundation, PostgreSQL, live HTTP.

Canonical Node command (no glob):

```text
node --experimental-strip-types --test \
  apps/web/lib/autonomy-control/plane.test.ts \
  apps/web/lib/autonomy-control/truth.test.ts \
  apps/web/lib/autonomy-control/compliance.test.ts \
  apps/web/lib/autonomy-control/policy-integration.test.ts \
  apps/web/lib/autonomy-control/testauth.test.ts \
  apps/web/lib/bff/jwt.test.ts \
  apps/web/lib/bff/csrf.test.ts
```
