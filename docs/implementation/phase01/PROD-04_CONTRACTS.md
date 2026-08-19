# PROD-04 — API Contracts

## Classification

| RPC | Status |
|---|---|
| ProvisionTenant | CURRENT |
| GetTenant | CURRENT |
| UpdateTenantConfig | CURRENT |
| CreateUser | CURRENT |
| AuthenticateUser | CURRENT |
| RefreshToken | CURRENT |
| ValidateToken | CURRENT |
| GetConfiguration | CURRENT |
| SetConfiguration | CURRENT |
| WatchConfiguration | DEFERRED |
| CheckPermission | CURRENT |
| ListRolePermissions | CURRENT |

## WatchConfiguration deferral

Streaming Watch is retained in the protobuf contract but is **not implemented** in Phase 01. Required before implementation: lifecycle, cancellation, reconnection, backpressure, authorization, tenant scope.

## Generation

Authoritative command (developer runtime):

```bash
buf lint
buf generate
buf breaking --against '.git#branch=arena/01a00bd2-agbofa-nexus-ai'
```

Arena: buf and protoc are **unavailable**. Generated clients were **not** fabricated.

Targets after generation:

- Go: `api/gen/go`
- Python: `api/gen/python`
- TypeScript: `api/gen/ts`
