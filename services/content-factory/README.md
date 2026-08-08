# Content Factory Services

**Implementation Unit:** IMP-010 — Content Factory  
**Authorization:** `docs/authorization/IAG-DECISION-IMP-010.md`

This module contains the authorized Content Factory implementation boundaries for:

- Story Intelligence Service (`SVC-047`)
- Editorial Content Generation Service (`SVC-048`)
- Multimedia Generation Service (`SVC-049`)
- Platform Adaptation Engine (`SVC-050`)
- SEO & Discoverability Service (`SVC-051`)
- Multilingual Content Service (`SVC-052`)
- Editorial Quality Assurance Service (`SVC-053`)
- Content Generation Pipeline (`SVC-054`)
- Brand Voice Engine (`SVC-055`)
- Human Review System (`SVC-056`)
- Volume 26 codebase specification services (`SVC-109` through `SVC-119`)
- Content Factory databases (`DB-017`, `DB-028`)
- Content Factory APIs (`API-019`, `API-031`) and events (`EVT-024` consumer, `EVT-041` producer)
- Content Factory workflows (`WF-020`, `WF-021`, `WF-031`)

## Architectural Boundary Notice

- IMP-010 consumes verified truth story events (`EVT-024` `truth_engine.story.verified`) from `IMP-008` as its clean event input boundary.
- All AI-assisted content generation, headline generation, summary generation, localization, and quality assurance integrate through the existing `IMP-006` AI Gateway (`github.com/agbofa/nexus/libs/go/pkg/llm`).
- No Compliance Gatekeeper (`IMP-011`), Distribution (`IMP-012`), Analytics (`IMP-013`), Reader (`IMP-014`), or Newsroom application (`IMP-015`) logic is implemented here.
