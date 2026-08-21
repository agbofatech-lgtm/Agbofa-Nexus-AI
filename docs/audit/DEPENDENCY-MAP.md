# MASTER DEPENDENCY GRAPH

```text
Phase 01  Identity, config, DB pool, RLS, JWT
    ↓
Phase 02  AI gateway (needs secrets + Phase 01 authz)
    ↓
Phase 03  Social OAuth + encrypted tokens + YouTube adapter
    ↓
Phase 04  Publishing schedule/queue/worker (needs Phase 03 tokens)
    ↓
Phase 05  Autonomy/memory/scenarios/cost + kill-switch gates Phase 04 Schedule
    ↓
Phase 06  Executive aggregation UI (needs honest labels; optional BFF overlay)
    ↓
Future controlled autonomy  REQUIRES: agent identity, tool bus, universal policy,
                            proven tenant isolation, proven publish chain,
                            cost hard-stops, live provider, no bypass paths
```

## Broken / incomplete dependencies

| From | To | Break |
|---|---|---|
| Phase 04 real PUBLISHED | Phase 03 YouTube exchange | Real distribution **BLOCKED**; callback historically `invalid_oauth` |
| Phase 05 “autonomous run” | Agent runtime | Runtime **MISSING**; runs are SIMULATION rows |
| Phase 06 “live health” | BFF session + foundation | Unauthenticated UI is FIXTURE |
| Docs “CERTIFIED” | Independent re-test | Multiple docs **INCONSISTENT** (Arena NOT CERTIFIED vs Windows CERTIFIED) |
| Proto contracts | Runtime mux | **INCONSISTENT** / gen empty |
| Named microservices | foundation | **SCAFFOLDED** — cannot depend on them |
| Frontend 28-agent OS | Orchestrator | **MISSING** |
| Billing / GDPR | Product | **MISSING** |

## What actually blocks production readiness

1. No independently re-verified real-provider publication.
2. OAuth path not closed under forensic standard (contradictory evidence).
3. Majority of product surface is frontend simulation.
4. Empty services vs architecture docs.
5. Autonomy not ready (Layer 7).
6. Security P0/P1 (binary in git, BFF JWT decode, CSRF unused, rate-limit spoof).
