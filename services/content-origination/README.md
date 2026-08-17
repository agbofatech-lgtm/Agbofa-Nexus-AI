# Content Origination Services

**Implementation Unit:** IMP-007 — Content Origination  
**Authorization:** `docs/authorization/IAG-DECISION-IMP-007.md`

This module contains the authorized Content Origination implementation boundaries for:

- Content Origination Engine (`SVC-030`) & Origination Codebase (`SVC-094`–`SVC-098`)
- News Ingestion Engine (`SVC-031`, `SVC-095`, `DB-015`, `API-013`)
- Source Management Service & Source Registry (`SVC-032`, `DB-016`)
- Story Detection Engine (`SVC-033`, `SVC-097`, `API-014`)
- Story Graph Initialization Service boundary adapter (`SVC-034`, `SVC-098`, `DB-013`)
- Story State Engine (`SVC-035`)
- Content Maestro Supervisor (`SVC-036`, `WF-016`, `WF-017`, `WF-029`)
- Content origination databases (`DB-013` adapter, `DB-015`, `DB-016`, `DB-026`)
- Content origination APIs (`API-013`, `API-014`, `API-015`, `API-029`)
- Content origination event schemas (`EVT-019`, `EVT-039`)

## Architectural Boundary Notice

- `SVC-034` implements only the origination story node initialization adapter for `DB-013` (Neo4j Store boundary). It does NOT implement IMP-009 Story Graph business logic or graph inference.
- `SVC-030` emits `EVT-019` (`truth_engine.story.submitted`) when a story enters `SUBMITTED_FOR_VERIFICATION` state. It does NOT implement Truth Engine (`IMP-008`) or verification processing.
- No Content Factory (`IMP-010`), Distribution (`IMP-012`), or Frontend applications (`IMP-014`–`IMP-015`) are implemented here.
