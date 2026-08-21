# MASTER CAPABILITY MATRIX

Audit HEAD `f3e4ad3`. Runtime column = this Arena audit unless noted. Security = summary only.

| Capability | Frontend | BFF | Backend | API | DB | Provider | Runtime | Security | Reality | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Authentication | EXISTS | EXISTS | EXISTS | JSON | EXISTS | n/a | IMPLEMENTED-NOT-VERIFIED | PARTIAL | PARTIAL | login BFF + Argon2id + JWT |
| Authorization | HIDE-ONLY | MISSING | EXISTS | mux | PARTIAL | n/a | IMPLEMENTED-NOT-VERIFIED | PARTIAL | PARTIAL | authz.Decide |
| Tenant management | DEMO | MISSING | EXISTS | GetTenant | EXISTS | n/a | UNKNOWN | RLS source | PARTIAL | repos + RLS SQL |
| AI Gateway | EXISTS | EXISTS | EXISTS | JSON | ledger | OpenAI/Anthropic | MOCK/PENDING | fail-closed keys | PARTIAL | llm gateway |
| AI Providers | n/a | n/a | EXISTS | n/a | n/a | HTTP | NOT LIVE | secrets env | PARTIAL | openai.go anthropic.go |
| Content origination | DEMO | MISSING | SCAFFOLDED | MISSING | MISSING | MISSING | SIMULATED | n/a | SIMULATED | empty service dir |
| Content factory | DEMO | MISSING | SCAFFOLDED | MISSING | MISSING | MISSING | SIMULATED | n/a | SIMULATED | empty dir |
| Truth engine | DEMO | MISSING | SCAFFOLDED | MISSING | MISSING | MISSING | SIMULATED | n/a | SIMULATED | `/truth` UI |
| Story graph | DEMO | MISSING | SCAFFOLDED | MISSING | MISSING | MISSING | SIMULATED | n/a | SIMULATED | reader mocks |
| Compliance/brand | COPY | via publish | EXISTS | JSON | brand fields | n/a | IMPLEMENTED-NOT-VERIFIED | gate | PARTIAL | branding.go |
| Social OAuth | EXISTS | EXISTS | EXISTS | JSON | EXISTS | Google | PARTIAL/UNVERIFIED | TokenBox | PARTIAL | social handlers |
| Distribution | DEMO+BFF | EXISTS | EXISTS | JSON | EXISTS | YouTube | BLOCKED real | tenant tx | PARTIAL | jobs |
| Publishing | NAV | EXISTS | EXISTS | JSON | EXISTS | YouTube | BLOCKED real | kill-switch | PARTIAL | publish worker |
| Scheduling | none | schedule | EXISTS | JSON | jobs | n/a | IMPLEMENTED-NOT-VERIFIED | authz | PARTIAL | Schedule RPC |
| Queue/workers | none | tick | EXISTS | Tick | SKIP LOCKED | n/a | IMPLEMENTED-NOT-VERIFIED | tenant claim | PARTIAL | queue.go |
| Analytics | DEMO | MISSING | PARTIAL | MISSING | snapshots | MISSING | SIMULATED | n/a | SIMULATED | phase3 fixtures |
| Memory | EXISTS | EXISTS | EXISTS | JSON | EXISTS | n/a | PARTIAL | privilege deny | PARTIAL | governed_memories |
| Strategy | DEMO | MISSING | MISSING | MISSING | MISSING | MISSING | SIMULATED | n/a | SIMULATED | strategy director |
| Agents | DEMO | MISSING | MISSING | MISSING | MISSING | MISSING | SIMULATED | n/a | SIMULATED | agents.json 28 |
| Autonomy | EXISTS | EXISTS | EXISTS | JSON | EXISTS | n/a | CLAIMED Windows | kill-switch | PARTIAL | autonomy pkg |
| AI Economics | EXISTS | EXISTS | EXISTS | JSON | ledger | n/a | ESTIMATED | n/a | PARTIAL | registry micros |
| Monetization | DEMO | MISSING | MISSING | MISSING | MISSING | MISSING | UNAVAILABLE | n/a | UNAVAILABLE | page only |
| Reader | DEMO | session | none | none | none | none | SIMULATED | n/a | SIMULATED | mocks |
| Newsroom | DEMO | session | none | none | none | none | SIMULATED | n/a | SIMULATED | mocks |
| Administration | DEMO | session | tenants | GetTenant | yes | n/a | UNKNOWN | n/a | PARTIAL | admin UI |
| Executive CC | EXISTS | overlay | reads | JSON | mixed | none | PARTIAL | no mutate | PARTIAL | `/growth` Phase 06 |
