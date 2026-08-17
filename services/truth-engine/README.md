# Truth Engine Services

**Implementation Unit:** IMP-008 — Truth Engine  
**Authorization:** `docs/authorization/IAG-DECISION-IMP-008.md`

This module contains the authorized Truth Engine implementation boundaries for:

- Core Truth Engine verification services (`SVC-037`–`SVC-042` & codebase `SVC-099`–`SVC-102`, `SVC-108`)
- Truth validation capabilities (`SVC-044`–`SVC-046` & codebase `SVC-103`–`SVC-107`)
- Truth Story Graph boundary adapter (`SVC-043` / `DB-013` boundary)
- Truth Engine operational and ledger databases (`DB-014`, `DB-027`)
- Truth Engine APIs (`API-016`, `API-017`, `API-018`, `API-030`)
- Truth Engine event consumers (`EVT-019` input boundary from Content Origination) and producers (`EVT-021`–`EVT-026`, `EVT-040`)
- Truth Engine workflow orchestration (`WF-018`, `WF-019`, `WF-030`)

## Architectural Boundary Notice

- `SVC-043` implements only the Truth Engine Story Graph node initialization adapter for `DB-013` (Neo4j Store boundary). It does NOT implement IMP-009 Story Graph business logic or graph inference.
- IMP-008 consumes `EVT-019` (`truth_engine.story.submitted`) emitted by IMP-007 Content Origination as its clean input boundary.
- All AI runtime invocations (claim extraction, evidence scoring, misinformation pattern checking) integrate through the existing IMP-006 AI Gateway foundation (`libs/go/pkg/llm`).
- No Content Factory (`IMP-010`), Distribution (`IMP-012`), Reader (`IMP-014`), or Newsroom application (`IMP-015`) logic is implemented here.
