# LAYER 1 — API & Contract Reality

Inspection SHA: `f3e4ad3` (implementation through `920f219` / `40de613`).

## Contract surfaces

| Surface | Classification | Evidence |
|---|---|---|
| Protobuf `foundation/v1/*.proto` | DEFINED, not GENERATED | Identity/config/authz protos exist; `api/gen/{go,ts,python}` are `.gitkeep` |
| Protobuf `distribution/v1/social.proto` | DEFINED, INCONSISTENT | RPC names `ConnectSocialAccount` vs mux `SocialService/Connect` |
| Protobuf autonomy / publish / ai | MISSING | Handlers registered under `/rpc/autonomy.v1.*`, `/rpc/publish.v1.*`, `/rpc/ai.v1.*` with **no** matching `.proto` |
| OpenAPI | SCAFFOLDED | `gateway-health.yaml` only |
| JSON Schema / AsyncAPI | SCAFFOLDED | envelope stub |
| Runtime API | IMPLEMENTED JSON HTTP | `services/foundation/internal/server/http.go` path mux |
| BFF | IMPLEMENTED | `apps/web/app/api/v1/**/route.ts` POSTs JSON to `/rpc/...` |
| Generated clients | ORPHANED / MISSING | no buf output committed |

## Handler registration vs proto vs BFF

| Runtime path | Proto | BFF | Verdict |
|---|---|---|---|
| `TenantIdentityService/AuthenticateUser` | PARTIAL (tenant_identity.proto) | `/api/v1/auth/login` | CONSUMED JSON, not protobuf wire |
| `TenantIdentityService/GetTenant` | PARTIAL | none found | IMPLEMENTED, weakly consumed |
| `AIGateway/Health`, `Complete` | MISSING proto | `/api/v1/ai/*` | IMPLEMENTED JSON |
| `SocialService/Connect`, `Callback`, `Accounts`, `Disconnect`, `CreateDistribution`, `ListDistributions`, `CancelDistribution` | INCONSISTENT names; **Callback not in proto** | social + distribution routes | IMPLEMENTED JSON |
| `PublishingService/Schedule,Approve,Cancel,Get,Tick` | MISSING proto | `/api/v1/publishing/*` | IMPLEMENTED JSON |
| `AutonomyService/*` (16 methods) | MISSING proto | `/api/v1/autonomy/*` | IMPLEMENTED JSON |

## Contract defects (material)

1. **Wire format is ad-hoc JSON**, not Connect/gRPC. Field names are Go struct tags — `CreateMemory` historically used **PascalCase without json tags** (`Insight`) while `CreateScenario` uses `json:"name"`. INCONSISTENT.
2. Auth login JSON field is `credential`, not `password`. Frontend login schema maps `password` → `credential` at BFF. DEFINED at BFF, easy to mismatch if calling RPC directly.
3. Pagination: List RPCs use `LIMIT 50/100` in SQL, **no cursor contract**.
4. Error contract: handlers `{"error": code}`; interceptors `{"error","status","ts"}`. INCONSISTENT.
5. Versioning: path-embedded `v1` only; no compatibility policy in runtime.

## Classification summary

DEFINED: small protobuf + JSON handlers
GENERATED: no
REGISTERED: foundation mux only
IMPLEMENTED: JSON RPCs listed above
CONSUMED: web BFF subset
ORPHANED: proto SocialService names, empty gen, empty OpenAPI, empty other services
INCONSISTENT: proto vs mux vs JSON tags vs error envelopes
