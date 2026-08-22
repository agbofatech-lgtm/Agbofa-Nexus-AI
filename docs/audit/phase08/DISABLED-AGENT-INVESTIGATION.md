# DISABLED_AGENT investigation

- timestamp: 2026-08-22
- inspect SHA: 956dabbab95c93599518c6429c7ee6a33e1718b9

## Every DISABLED_AGENT return

| File | Function | Condition |
|---|---|---|
| libs/go/pkg/autonomy/control.go Resolve | `p.enabled[tenant][agent]` is false | HTTP Execute maps this to BLOCKED |
| apps/web/lib/autonomy-control/plane.ts resolve | tenant enable set missing | Node unit only |

No other production returns.

## Proven facts

1. Enable and Execute share one `*Plane` from `Compose` (`NewPlane()` once). Receivers are pointers. Not a value-copy bug.
2. Enable writes `enabled[rawTenant][rawAgent]`. LookupAgent uppercases/trims only a local copy. Resolve previously read `enabled[rawActorTenant][rawAgentID]`.
3. Same-plane, same-string Enable+Resolve already succeeded in unit tests. Therefore HTTP DISABLED_AGENT after a successful Enable is a **key mismatch**:
   - agent ID not canonical (whitespace/case), and/or
   - tenant ID not the same principal (JWT `tenant_id` UUID vs test-auth hardcoded `tenant-a`).
4. Mixing `Authorization: Bearer test-token-123` (tenant-a) with a session JWT (UUID) writes and reads different map keys. That is isolation working, not a bypass candidate.
5. AGT-014 is IMPLEMENTED. After Resolve succeeds, `analyze_story` on AGT-014 is **UNAUTHORIZED_TOOL** (publisher tools only). Use AGT-003 for analyze_story.

## Fix applied

Canonical enablement keys: `TrimSpace(tenant)` + `LookupAgent` canonical `spec.ID`.
Enable/Execute responses echo `tenant_id`/`principal_tenant` and `plane` pointer.
`AUTONOMY_DEBUG=true` logs ENABLE/RESOLVE without secrets.
Optional `X-Agbofa-Test-Tenant` binds the test bearer to an explicit tenant (still requires Enable).

Rejected: auto-enable, skip Resolve, share enablement across tenants, grant AGT-014 analyze_story.
