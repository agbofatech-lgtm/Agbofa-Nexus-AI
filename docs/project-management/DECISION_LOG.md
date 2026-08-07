# Decision Log

**Status:** Active.  
**Rule:** Record project operating decisions that are not ADR replacements. ADRs remain authoritative for architecture decisions.

| Date | Decision ID | Decision | Rationale | Scope | Approval Source | Related Files | Status |
|---|---|---|---|---|---|---|---|
| 2026-08-07 | DEC-0001 | Use repository-backed permanent memory for AI-assisted enterprise implementation. | Documentation exceeds conversational context; repository artifacts preserve continuity. | Project governance | User instruction | docs/manifest/, docs/indexes/ | Active |
| 2026-08-07 | DEC-0002 | Adopt Recommendation → Approval → Implementation workflow. | Prevents architecture drift and unauthorized technical changes. | All documentation and implementation work | User instruction | docs/governance/, docs/manifest/ | Active |
| 2026-08-07 | DEC-0003 | Adopt Permanent Enterprise Engineering Agent Charter. | Defines long-term role, responsibilities, context management, implementation lifecycle, quality gates, and governance. | Entire project | User instruction | docs/governance/PERMANENT_ENTERPRISE_ENGINEERING_AGENT_CHARTER.md | Active |
| 2026-08-07 | DEC-0004 | Adopt Source Preservation Layer. | Original approved documentation must remain immutable while OCR JSON, Markdown, text, and image extractions remain traceable. | Documentation intake and all downstream implementation | User instruction | docs/governance/SOURCE_PRESERVATION_LAYER.md, source/, extracted/ | Active |
| 2026-08-07 | DEC-0005 | Adopt Canonical Entity Registry model. | Stable identifiers reduce naming drift across 4,500+ pages, code, tests, and deployment artifacts. | Documentation, implementation, testing, release | User instruction | docs/indexes/*_REGISTRY.md | Active |
| 2026-08-07 | DEC-0006 | Adopt Architecture Validation Gate before code generation. | Prevents implementation from proceeding unless requirements, source volumes, ADRs, owners, contracts, tests, and documentation links are verified. | All implementation work | User instruction | docs/governance/ARCHITECTURE_VALIDATION_GATE.md | Active |
| 2026-08-07 | DEC-0007 | Adopt AI Retrieval Layer. | Ensures each implementation request retrieves the correct documentation subset instead of relying on temporary conversation memory. | All implementation work | User instruction | docs/governance/AI_RETRIEVAL_LAYER.md | Active |
