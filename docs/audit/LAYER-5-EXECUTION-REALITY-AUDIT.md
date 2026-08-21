# LAYER 5 — Execution Reality

Legend: LIVE = proven external/system effect; RUNTIME-VERIFIED = executed tests/ops with SHA; IMPLEMENTED-NOT-VERIFIED = source exists, this audit did not run it; SIMULATED/DEMO/MOCK/UNAVAILABLE/UNKNOWN.

| Capability | Frontend | BFF | Backend | API | DB | Provider | Runtime (this audit) | Overall |
|---|---|---|---|---|---|---|---|---|
| Authentication | login UI | login+cookie | Argon2id + JWT | JSON RPC | users/refresh | n/a | Windows login claimed in Phase 06 Windows doc; Arena not re-run | IMPLEMENTED-NOT-VERIFIED |
| Authorization | none (UI hide) | none | authz.Decide | mux authorize | role_policies unused? | n/a | unit source | IMPLEMENTED-NOT-VERIFIED |
| Tenant management | admin fixtures | GetTenant unused | tenants repo | GetTenant | tenants+RLS | n/a | UNKNOWN | PARTIAL |
| AI Gateway | complete route | `/ai/complete` | llm.Gateway | JSON | usage ledger | OpenAI/Anthropic | real provider PENDING | PARTIAL |
| Content origination/factory | newsroom UI | none | empty service dir | none | none | none | DEMO | SIMULATED |
| Truth engine | `/truth` UI | none | empty dir | none | none | none | DEMO | SIMULATED |
| Story graph | reader fixtures | none | empty | none | none | none | DEMO | SIMULATED |
| Compliance | copy in UI | none | branding gate in social | none | jobs.brand | none | unit branding tests exist, not run here | PARTIAL |
| Social OAuth | connect page | connect/callback | SocialService | JSON | oauth_states, connections | Google/YouTube | historically BLOCKED; later Windows claim connect; callback `invalid_oauth` unresolved in Arena | PARTIAL |
| Distribution | studio/queue fixtures | create/list | jobs | JSON | distribution_* | YouTube only | real distribution BLOCKED | PARTIAL |
| Publishing | links to workflow | schedule/tick | state machine+worker | JSON | jobs+attempts | YouTube | schedule claimed on Windows; real platform BLOCKED | PARTIAL |
| Scheduling/queue/workers | none | tick proxy | SKIP LOCKED | Tick RPC | jobs | n/a | Windows Phase 04 claim; not re-run | IMPLEMENTED-NOT-VERIFIED |
| Analytics | charts fixtures | none | analytics_snapshots | none | table | none | SIMULATED | SIMULATED |
| Memory | growth/memory | memory routes | governed_memories | JSON | yes | n/a | Windows: invalid_argument until schema; not re-verified | PARTIAL |
| Strategy | Strategy Director | none | none | none | none | none | SIMULATED | SIMULATED |
| Agents | 28 registry UI | none | none | none | none | none | DEMO (count is registry length, labeled FIXTURE in Phase 06) | SIMULATED |
| Autonomy | control UI | autonomy BFF | policy+store | JSON | autonomy_* | none | Windows: SetLevel + kill-switch persist claimed | PARTIAL / RUNTIME-VERIFIED* |
| AI Economics | ai-cost UI | cost BFF | registry micros | JSON | ai_usage_ledger | none | ESTIMATED only | PARTIAL |
| Monetization | page | none | none | none | none | none | DEMO | UNAVAILABLE |
| Reader/Newsroom/Admin | pages | session | identity only | — | — | — | DEMO data | SIMULATED |
| Executive Command Center | `/growth` | live overlay | autonomy/social reads | JSON | mixed | none | Arena HTTP 200 + typecheck/build; Windows dashboard PASS claimed | PARTIAL |

\*Kill-switch/level: owner-reported Windows runtime, not re-executed in this Arena audit. Treat as **claimed RUNTIME-VERIFIED**, independent status **UNVERIFIED**.

Frontend execution flags (`realPublishing`, `autonomousExecution`, etc.) are **false**.
