# Phase 06 — Integration evidence

Phase 06 aggregates. It does not replace domain engines.

| Domain | Integration | Reality |
|---|---|---|
| Phase 01 | Existing layout, auth guard, cinematic system | Frontend AVAILABLE as shell; not uptime telemetry |
| Phase 02 | Growth metrics/opportunities via existing service | FIXTURE / SIMULATED |
| Phase 03 | Distribution/analytics/experiments/attribution | PARTIALLY CERTIFIED; YouTube NOT_CONNECTED unless live accounts say otherwise |
| Phase 04 | Strategy, decisions, publishing workflow links | Publishing chain displayed; no bypass |
| Phase 05 | Autonomy, memory, scenarios, cost via BFF overlay when session exists | Kill-switch/cost/memory hydrate read-only; fixtures labeled when unauthenticated |

| Test ID | Description | Result |
|---|---|---|
| PH06-R14 | Command search domains | Stories, Intelligence, Opportunities, Agents, Strategies, Experiments, Analytics, Settings, Memory, Scenarios, Distribution, Publishing |
| PH06-R15 | Search side-effect safety | Every `ExecutiveSearchRecord.mutates === false`; Publish/Approve/Run navigate only |
| PH06-R16 | Activity integrity | Fixture events labeled FIXTURE; live audit appended only from BFF |
| PH06-R17 | Health integrity | PENDING/NOT_CONNECTED/ESTIMATED/SIMULATED used; not all HEALTHY |
| PH06-R18 | Intelligence loop | Ten stages; EXECUTE is PENDING unless kill-switch ENGAGED (then blocked ACTUAL) |
| PH06-R19 | Execution reality labels | Extended badge: PROJECTED, PENDING, NOT_CONNECTED, FIXTURE, ESTIMATED |
| PH06-R20 | Provenance | DataSourceIndicator retained |
| PH06-R21 | Phase 04 publishing boundary | Governance chain; no schedule/publish RPC from Command Center |
| PH06-R22 | Branding boundary | Missing brand blocks publish; UI discloses, does not bypass |
| PH06-R23 | Autonomy boundary | Display cannot grant autonomy |
| PH06-R24 | Kill-switch boundary | Overlay sets blocksPublishingSchedule from persisted ENGAGED |
| PH06-R25 | Memory privilege | `privilege: DATA_ONLY`; cannot grant RBAC |
| PH06-R26 | Scenarios | `kind: PROJECTED` |
| PH06-R27 | Cost | `costKind: ESTIMATED` |
| PH06-R41–R45 | Phase 1–5 route HTTP | 200 on sampled routes; not a re-certification of those phases |

Cross-phase certification is not upgraded by rendering their data.
