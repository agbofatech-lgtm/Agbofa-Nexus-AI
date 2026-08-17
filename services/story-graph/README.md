# Story Graph & Knowledge Intelligence Services

**Implementation Unit:** IMP-009 — Story Graph & Knowledge Intelligence  
**Authorization:** `docs/authorization/IAG-DECISION-IMP-009.md`

This module contains the authorized Story Graph implementation boundaries for:

- Truth Story Graph Service (`SVC-043`, Volume 13)
- Story Graph Data Model Codebase (`SVC-120`, Volume 27)
- Graph Lifecycle Engine Codebase (`SVC-121`, Volume 27)
- Knowledge Intelligence Service Codebase (`SVC-122`, Volume 27)
- Story Versioning Service Codebase (`SVC-123`, Volume 27)
- Duplicate/Similarity Engine Codebase (`SVC-124`, Volume 27)
- Graph Search Service Codebase (`SVC-125`, Volume 27)
- Story Memory Service Codebase (`SVC-126`, Volume 27)
- Story Graph Neo4j Store (`DB-013`) and Code Data Architecture (`DB-029`)
- Story Graph APIs (`API-017`, `API-032`) and events (`EVT-026` consumer, `EVT-042` producer)
- Story Graph workflows (`WF-019`, `WF-032`)

## Architectural Boundary Notice

- IMP-009 connects to origination story nodes initialized by `IMP-007` (`SVC-034`) and verified truth story nodes initialized by `IMP-008` (`SVC-043` boundary adapter).
- IMP-009 consumes `EVT-026` (`truth_engine.story.versioned`) emitted by `IMP-008` as an idempotent consumer to trigger relationship versioning (`WF-019`).
- All AI-assisted entity extraction and similarity clustering integrate through the existing `IMP-006` AI Gateway (`github.com/agbofa/nexus/libs/go/pkg/llm`).
- No Content Factory (`IMP-010`), Distribution (`IMP-012`), Reader (`IMP-014`), or Newsroom application (`IMP-015`) logic is implemented here.
