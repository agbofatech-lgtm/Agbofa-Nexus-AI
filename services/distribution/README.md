# Distribution Engine Services

**Implementation Unit:** IMP-012 — Distribution Engine  
**Authorization:** `docs/authorization/IAG-DECISION-IMP-012.md`

This module contains the authorized Distribution Engine implementation boundaries for:

- Publication Orchestration Service (`SVC-065`, `SVC-066`, `SVC-127`)
- Platform Connector Framework & Implementations (`SVC-067`, `SVC-073`, `SVC-128`, `SVC-131`)
- Scheduling & Campaign Engine (`SVC-068`, `SVC-129`)
- Breaking News Delivery Service (`SVC-069`)
- Multi-Channel Synchronization Service (`SVC-070`)
- Correction & Retraction Engine (`SVC-071`, `SVC-132`)
- Delivery Monitoring & Proof-of-Publication Service (`SVC-072`, `SVC-133`)
- Queue Management & Resilience Service (`SVC-072`, `SVC-074`, `SVC-130`)
- Distribution Operational Store (`DB-019`, Volume 17/28)
- Distribution Engine APIs (`API-021`, `API-033`) and events (`EVT-024` compliance consumer, `EVT-027`–`EVT-033`, `EVT-043` producers)
- Distribution Engine Workflows (`WF-023`, `WF-033`)

## Architectural Boundary Notice

- IMP-012 consumes approved content package events (`EVT-024` `content_factory.package.approved`) from `IMP-010`/`IMP-011` as its clean input boundary.
- IMP-012 strictly enforces the IMP-011 Compliance Gatekeeper boundary: packages in `REVIEW_REQUIRED` or `REJECTED` status are rejected from entering distribution schedules or publishing queues.
- All AI-assisted adaptation and delivery scheduling integrate through the existing `IMP-006` AI Gateway (`github.com/agbofa/nexus/libs/go/pkg/llm`).
- No Analytics (`IMP-013`), Reader (`IMP-014`), or Newsroom application (`IMP-015`) logic is implemented here.
