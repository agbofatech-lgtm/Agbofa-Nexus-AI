# Foundation Services

**Implementation Unit:** IMP-003 — Core Platform Foundation  
**Phase 01:** PROD-00 (certified) + PROD-01 (database runtime)

This module contains the authorized Core Platform Foundation implementation for:

- Tenant & Identity Service
- Global Configuration Service
- Foundation data schema migrations
- Foundation API contract alignment
- PostgreSQL pool, migrations, and concrete repositories (PROD-01)

## PROD-01 developer runtime

PostgreSQL is required. Arena cannot execute these tests.

```powershell
$env:AGBOFA_TEST_DATABASE_URL = "postgres://USER:PASS@127.0.0.1:5432/nexus_test?sslmode=disable"
cd services/foundation
go mod tidy
go test ./internal/repositories/... -v
go test ./...
go vet ./...
go build ./...
```

Do not paste production passwords into Arena. Record evidence against the exact commit SHA.

## Scope Boundary

This module does not implement API Gateway/Event Platform runtime, business-domain services, frontend applications, AI agents, or production deployment.
