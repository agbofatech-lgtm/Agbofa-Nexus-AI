# Phase 08 requirements matrix (Windows reproduction attempt)

- timestamp: 2026-08-22T08:48:23Z
- START / TESTED SHA: `0b25e0996fbc2d8784e02bcea4382096b313d9ce`
- environment: Arena Linux — not Windows 11; Go/PostgreSQL unavailable

Status values: PASS | PARTIAL | FAIL | BLOCKED | NOT VERIFIED

| Requirement | Implementation | Unit Test | Integration Test | Runtime Test | Evidence | Status |
|---|---|---|---|---|---|---|
| Windows 11 host | N/A | — | — | FAIL | WINDOWS-REPRODUCTION.txt | BLOCKED |
| TruthEngine interface + dev impl | YES | Node PASS | BLOCKED | BLOCKED | NODE-TEST.txt / TRUTH-TEST.txt | PARTIAL |
| UNKNOWN ≠ TRUE | YES | Node PASS | BLOCKED | BLOCKED | TRUTH-TEST.txt | PARTIAL |
| ComplianceEngine + dev impl | YES | Node PASS | BLOCKED | BLOCKED | COMPLIANCE-TEST.txt | PARTIAL |
| ERROR ≠ COMPLIANT | YES | Node PASS | BLOCKED | BLOCKED | COMPLIANCE-TEST.txt | PARTIAL |
| Engines wired in Plane high-risk path | YES | Node PASS | BLOCKED | BLOCKED | NODE-TEST.txt | PARTIAL |
| Test auth fail-closed in production | YES | Node PASS | BLOCKED | BLOCKED | NODE-TEST.txt | PARTIAL |
| JWT RS256 not weakened | YES | Node jwt.test.ts PASS | BLOCKED | BLOCKED | NODE-TEST.txt | PARTIAL |
| Kill switch still blocks | YES | Node PASS | NOT VERIFIED live | BLOCKED | NODE-TEST.txt | PARTIAL |
| Forbidden tools denied | YES | Node PASS | NOT VERIFIED live | BLOCKED | NODE-TEST.txt | PARTIAL |
| Tenant isolation / RLS | YES (code) | Node PARTIAL | BLOCKED | BLOCKED | TENANT-ISOLATION-TEST.txt | BLOCKED |
| Brand required for publish | YES | Node PASS | BLOCKED | BLOCKED | NODE-TEST.txt | PARTIAL |
| Production autonomy disabled | YES source | Node PASS | N/A | BLOCKED | plane.productionAutonomy | PARTIAL |
| Live POST /v1/autonomy/execute | Route exists | — | BLOCKED | BLOCKED | RUNTIME-TEST.txt | BLOCKED |
| go test ./... | — | BLOCKED | BLOCKED | BLOCKED | GO-TEST.txt | BLOCKED |
| go test -race / go vet | — | BLOCKED | BLOCKED | BLOCKED | GO-VET-RACE.txt | BLOCKED |
| Coverage measured | — | BLOCKED | — | — | COVERAGE.txt | NOT VERIFIED |
| Execution persistence | Migration only | — | — | — | AUDIT-TEST.txt | NOT VERIFIED |
| Postgres schema | Migration files | — | BLOCKED | BLOCKED | DATABASE-TEST.txt | BLOCKED |
| Secret clearance | historical leak tracked | — | — | — | SECURITY-TEST.txt | BLOCKED |

Do not infer PASS for live/runtime from unit tests.
Do not treat this matrix as CERTIFIED.
