# Phase 7–9 Feature and Navigation Restoration Map

**Baseline:** `3176a46db3c029fac2156e640ee0d7ebed351b33`

**Pre-Phase-1 comparison:** `66100f94b0dcd41ee539336ae9387ee0ef1b760c`

**Scope:** Frontend-only restoration inside the Phase 1 cinematic shell.

## Reconnaissance conclusion

All requested Phase 7–9 feature pages, component systems, hooks, Zustand stores, mock datasets, and service adapters survived Phase 1. Phase 1 changed the feature dashboard wrappers only from nested `main` landmarks to neutral `div` containers; it did not remove their content or data flows.

The restoration gap is navigation coverage:

- the Phase 1 top navigation omitted Agents and used Settings as a primary item;
- the Phase 1 mobile bottom navigation used Home instead of Agents;
- the Phase 1 sidebar exposed only the current context plus primary workspace switches, making many Phase 7–9 destinations indirect;
- the previous full Intelligence, Content, Business, and System group coverage was no longer visible together.

No old feature file or pre-Phase-1 CSS needs to be copied over Phase 1.

## Preservation and restoration matrix

| Feature | Current state at Phase 1 baseline | Pre-Phase-1 state | Missing? | Established route | Existing components / architecture | Navigation at baseline | Restoration required |
|---|---|---|---|---|---|---|---|
| Agents | Complete registry, filters, cards, detail, simulated telemetry, tasks, dependencies, execution timeline, loading/empty/error states | Same feature implementation | No | `/agents`, `/agents/[agentId]`, category routes | `AgentCard`, `AgentGrid`, `AgentTelemetry`, `useAgents`, agents store/service/mock | Indirect under Intelligence context; absent from top/mobile primary navigation | Add Agents to top and mobile; retain under Intelligence sidebar |
| AI Control | Provider/model/control presentation with explicit demo and not-connected boundaries | Same feature implementation | No | `/ai-control` | `AIControl`, provider/model components, `useAIControl`, AI Control service/mock | Available through Intelligence primary and context | Keep primary Intelligence mapping and expose directly in full sidebar/More |
| Distribution | 16-channel inventory, composer, calendar, analytics, manual/not-verified connection states | Same feature implementation | No | `/distribution` | `DistributionDashboard`, channel components, business hook/store/service/mock | Primary top item; sub-context required before other business routes appear | Keep top item and expose full Business group |
| Analytics | Overview metrics, time controls, six-series cross-module chart, content analytics, possible drivers, demo authority | Same feature implementation | No | `/analytics` | `AnalyticsDashboard`, chart/overview/control components, business architecture | Primary top item; present in Analytics context | Keep top item and expose under Business group |
| Growth | Metrics, flywheel, funnel, channel performance, retention, campaigns, referrals, experiments, recommendations | Same feature implementation | No | `/growth` | `GrowthDashboard`, business hook/store/service/mock | Indirect after opening Distribution | Expose directly under Business and More |
| Monetization | Revenue, plans, paywall presentation, campaigns, churn with demo labels | Same feature implementation | No | `/monetization` | `MonetizationDashboard`, business hook/store/service/mock | Indirect after opening Distribution | Expose directly under Business and More |
| Admin | Demo tenant context, users, roles, settings, audit log and child routes | Same feature implementation; Phase 1 added separate frontend Settings/Profile routes | No | `/admin`, `/admin/tenants`, `/admin/users` | `AdminDashboard`, admin components, business architecture | Indirect after opening Settings | Expose directly under System and More |
| AI Cost | Provider costs, agent breakdown, free-tier monitor, budget presentation, forecast, recommendations | Same feature implementation | No | `/ai-cost` | `AICostDashboard`, business hook/store/service/mock | Indirect after opening Analytics | Expose directly under System and More |
| Predictive | Virality, engagement, trends, recommendations and dynamic chart | Same feature implementation | No | `/predictive` | `PredictiveDashboard`, intelligence hook/store/service/mock | Available only after entering Intelligence | Expose directly in full Intelligence group and More |
| Personalization | Reader personalization plus intelligence profile, recommendations, affinity, feed and local settings | Same feature implementation | No | `/personalization` | `PersonalizationDashboard`, personalization/intelligence hooks, stores, services, mocks | Available only after entering Reader/Intelligence | Expose directly in full Intelligence group and More |
| Multimodal | Local media selection, frontend analysis demonstration, preview, relationships, loading/error/unavailable states | Same feature implementation | No | `/multimodal` | `MultimodalStudio`, intelligence hook/store/service/mock | Available only after entering Intelligence | Expose directly in full Intelligence group and More |
| Origination | Source inventory and ingestion pipeline | Same feature implementation | No | `/newsroom/origination` | Newsroom source/pipeline components and newsroom architecture | Available only after entering Newsroom | Expose directly under Content and More |
| Content Factory | Package generator and frontend-local output workflows | Same feature implementation | No | `/newsroom/factory` | Newsroom factory components and newsroom architecture | Available only after entering Newsroom | Expose directly under Content and More |
| Editorial Review | Review queue, status/filter controls and explicit demo authority | Same feature implementation | No | `/newsroom/review` | Newsroom review components and newsroom architecture | Available only after entering Newsroom | Expose directly under Content and More |

## Route convention decision

The repository has never used standalone `/intelligence`, `/content-factory`, or `/editorial-review` pages. Its established routing is:

```text
Intelligence entry       → /ai-control
Origination              → /newsroom/origination
Content Factory          → /newsroom/factory
Editorial Review         → /newsroom/review
```

No aliases will be invented. Existing routes remain authoritative.

## Controlled restoration plan

1. Keep all Phase 1 feature, token, shell, and visual files intact.
2. Update only the centralized navigation model and its renderers.
3. Top navigation: Reader, Intelligence, Newsroom, Agents, Distribution, Analytics; retain the existing user menu.
4. Sidebar: restore complete Intelligence, Content, Business, and System groups in one centralized model, with explicit active item and active group styling.
5. Mobile: Reader, Intelligence, Newsroom, Agents, More; More opens the full sidebar containing all remaining required destinations.
6. Keep Dashboard discoverable from the clickable Nexus brand and global search.
7. Preserve all mock → service → hook/store → component → page boundaries.
8. Do not add routes, feature duplicates, backend calls, credentials, or security implementation.
