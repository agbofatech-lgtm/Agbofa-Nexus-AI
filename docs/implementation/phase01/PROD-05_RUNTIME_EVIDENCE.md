# PROD-05 — Backend RPC Evidence

**Implementation:** COMPLETE (composition root + HTTP proto-aligned RPC + health/ready + interceptors)  
**Runtime:** PENDING  

gRPC generated service registration is pending `buf generate` (PROD-04 tooling). Handlers call real TenantIdentityService / repositories. Transport until generated stubs exist: JSON `/rpc/<package>.<Service>/<Method>`.

```text
GET /healthz
GET /readyz
```
