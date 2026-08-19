# Phase 1.5 Capability and Elevation Map

**Baseline:** `3d945ce1fbd8cd6ccbfdfd7fd341dd6f32d8c078`

**Scope:** Frontend-only elevation. Backend, BFF, database, authentication security, OAuth, provider credentials, RPC, and API contracts are excluded.

The repository already contains 29 page routes, 208 components, 12 hooks, 8 Zustand stores, 12 mock-backed service adapters, and 11 mock modules. No UI component imports mock modules directly and no frontend network client exists.

| Capability | Exists | Quality | Route | Data | Backend dependency | Action |
|---|---:|---|---|---|---|---|
| Analytics | Yes | GOOD / NEEDS REFINEMENT | `/analytics` | business service/store | Live telemetry unavailable | Add shared insight, provenance, and operating loop |
| Agents | Yes | GOOD / NEEDS REFINEMENT | `/agents` | agents service/store | Runtime unavailable | Add operations/activity language; preserve registry |
| Distribution | Yes | GOOD / INCOMPLETE | `/distribution` | business service/store | OAuth/publishing unavailable | Add deterministic local platform templates |
| AI Control | Yes | GOOD / BACKEND-DEPENDENT | `/ai-control` | intelligence service/store | Providers unavailable | Remove fake connection posture; add control path |
| Growth | Yes | GOOD | `/growth` | business service/store | Attribution unavailable | Connect existing funnel to value chain |
| Monetization | Yes | GOOD / BACKEND-DEPENDENT | `/monetization` | business service/store | Billing unavailable | Add reader-to-value journey |
| AI Cost | Yes | GOOD / BACKEND-DEPENDENT | `/ai-cost` | business service/store | Billing/tokens unavailable | Add cost/output relationship |
| Newsroom | Yes | GOOD / NEEDS REFINEMENT | `/newsroom` | newsroom service/store | Ingestion/publishing unavailable | Add editorial workflow; remove false real-time language |
| Settings | Yes | INCOMPLETE | `/settings` | browser/local state | Most control planes unavailable | Add capability-aware directory |
| Reader | Yes | EXCELLENT | `/reader` | reader/story services | Live corpus unavailable | Preserve; add structured story intelligence |

## Design-system audit

- Cinematic identity: **EXCELLENT — preserve**.
- Dark theme: **GOOD — evolve to approved royal-blue semantic palette**.
- Light theme: **NEEDS REFINEMENT — replace warm inversion with explicit cool tokens**.
- Charts: **NEEDS REFINEMENT — hardcoded dark tooltip/axis colors**.
- Data authority: **GOOD BUT TOO LOUD — internal provenance exists; disclosure repeats excessively**.
- Workflow/activity: **PARTIAL — feature-specific patterns exist; shared language is missing**.
- Responsive/accessibility/performance: **GOOD STATIC FOUNDATION; rendered certification unavailable**.

## Implementation decision

Preserve every existing feature and route. Add a small shared operations/provenance layer, explicit dark/light tokens, theme-aware charts, deterministic local social templates, a settings control-plane directory, and structured Reader intelligence. Do not create new routes, state libraries, UI libraries, backend calls, or fake connectivity.
