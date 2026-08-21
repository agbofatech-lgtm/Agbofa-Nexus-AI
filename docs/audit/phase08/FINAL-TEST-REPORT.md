# Phase 08 Final Test Report

- timestamp: 2026-08-21T21:48:35Z
- start SHA: 01156dac59c37cc9defa00050fbdbc54b8ec0d1f
- environment: Arena Node v22.22.3; Go NOT AVAILABLE; PostgreSQL NOT AVAILABLE

| Suite | Command | Result |
|---|---|---|
| Gate 0 Node regression | node --experimental-strip-types --test plane/jwt/csrf | 28 pass |
| Truth | node ... truth.test.ts | 5 pass |
| Compliance | node ... compliance.test.ts | 6 pass |
| Policy integration | node ... policy-integration.test.ts | 5 pass |
| Test auth | node ... testauth.test.ts | 5 pass |
| Full Node Phase 07+08 | see REGRESSION-NODE.txt | **49 pass / 0 fail** |
| go test ./libs/go/pkg/autonomy | — | **BLOCKED** |
| go test ./... | — | **BLOCKED** |
| go test -cover | — | **BLOCKED** |
| Live foundation HTTP | go run ./services/foundation/cmd/server | **BLOCKED** |

Production autonomy: DISABLED
