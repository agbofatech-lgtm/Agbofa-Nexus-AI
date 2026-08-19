# PROD-01 — Database Runtime Evidence

**Phase:** 01  
**Subphase:** PROD-01  
**Status:** IMPLEMENTED — RUNTIME **BLOCKED** IN ARENA  
**Certification:** NOT PASS  

Arena has no Go toolchain and no reachable PostgreSQL. Integration tests were written to fail closed if `AGBOFA_TEST_DATABASE_URL` is unset. They were **not** executed here.

```text
PHASE: 01
SUBPHASE: PROD-01
COMMIT: <filled after push>
REMOTE: origin/arena/01a01a0f-agbofa-nexus-ai
ENVIRONMENT: arena-sandbox
DATE/TIME: 2026-08-19
OS: Debian 12 (E2B)
GO: unavailable
POSTGRESQL: unavailable
DOCKER: unavailable
COMMAND: go test ./internal/repositories/... -v
RESULT: BLOCKED
EXIT CODE: n/a
RELEVANT OUTPUT: go and PostgreSQL are not present in the Arena sandbox
TEST COVERAGE: not executed
KNOWN LIMITATIONS: runtime evidence must come from the developer environment against this exact commit
```

## Developer runtime required

```powershell
git fetch origin arena/01a01a0f-agbofa-nexus-ai
git checkout arena/01a01a0f-agbofa-nexus-ai
git rev-parse HEAD

# provision a disposable test database; do not use production
$env:AGBOFA_TEST_DATABASE_URL = "postgres://USER:PASS@127.0.0.1:5432/nexus_test?sslmode=disable"

cd libs/go
go mod tidy
go test ./pkg/database/...
go vet ./pkg/database/...
go build ./pkg/database/...

cd ../../services/foundation
go mod tidy
go test ./internal/repositories/... -v
go test ./...
go vet ./...
go build ./...
```

Return evidence bound to the exact SHA. Do not paste the database password.

PROD-02 must not start until PROD-01 = PASS with executable PostgreSQL evidence.
