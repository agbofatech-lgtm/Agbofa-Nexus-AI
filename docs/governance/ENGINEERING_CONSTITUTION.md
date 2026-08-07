# Agbofa Nexus AI — Enterprise Engineering Constitution

**Project:** Agbofa Nexus AI — Autonomous AI Media Company Platform  
**Company:** Agbofa Technologies  
**Baseline:** Approved Enterprise Documentation v1.0  
**Scope:** AI-assisted implementation governance, repository memory, quality gates, and certification rules  
**Status:** Active governance document; no production implementation started  

---

## 1. Supreme Authority

The approved Agbofa Nexus AI documentation is the single source of truth.

This includes:

- 37 Enterprise Architecture Volumes
- Phase 5 Engineering Constitution
- Master Specifications
- Implementation Specifications
- Coding Standards
- ADRs
- Repository Governance
- Approved enterprise baseline documentation

No implementation may contradict the approved documentation.

---

## 2. Absolute Rules

1. Never invent architecture.
2. Never redesign approved systems.
3. Never remove technical detail.
4. Never simplify enterprise workflows.
5. Never change APIs, databases, or ADRs without approval.
6. Never generate code from assumptions.
7. Always preserve traceability.
8. Always keep documentation synchronized.
9. Maintain enterprise coding standards throughout the project.
10. Follow Recommendation → Approval → Implementation.

---

## 3. Never Guess Rule

If any information is missing, ambiguous, or contradictory:

```text
STOP.
```

Do not invent:

- services
- APIs
- databases
- workflows
- UI
- AI agents
- infrastructure components
- security policies
- events
- prompts
- ADR decisions

Instead:

1. Record the issue.
2. Explain why it is ambiguous.
3. Recommend possible resolutions.
4. Wait for approval.

Any ambiguity that may affect architecture, implementation, testing, deployment, security, or AI behavior must be recorded in:

```text
docs/indexes/ARCHITECTURE_DRIFT_REGISTER.md
```

---

## 4. Repository Memory Rule

The repository is the permanent memory.

Conversation memory is temporary.

Before beginning another task, update all relevant repository memory artifacts:

- `docs/manifest/MASTER_DOCUMENTATION_MANIFEST.md`
- `docs/indexes/TRACEABILITY_MATRIX.md`
- `docs/indexes/SERVICE_INDEX.md`
- `docs/indexes/API_INDEX.md`
- `docs/indexes/DATABASE_INDEX.md`
- `docs/indexes/AGENT_INDEX.md`
- `docs/indexes/EVENT_INDEX.md`
- `docs/indexes/SECURITY_INDEX.md`
- `docs/indexes/IMPLEMENTATION_STATUS.md`
- `docs/indexes/ARCHITECTURE_DRIFT_REGISTER.md`

Root-level pointer files exist only for discoverability. Canonical updates belong in `docs/manifest/` and `docs/indexes/`.

---

## 5. Mandatory Implementation Process

Every task must follow:

```text
Documentation Review
  ↓
Dependency Analysis
  ↓
Implementation Card
  ↓
Recommendation
  ↓
Approval
  ↓
Implementation
  ↓
Testing
  ↓
Documentation Update
  ↓
Validation
  ↓
Commit
```

No implementation may skip the recommendation and approval gate unless the user explicitly approves a narrowly scoped action.

---

## 6. Coding Constitution

Every generated or modified production file must satisfy the applicable approved coding standards and the following engineering principles:

- SOLID
- Clean Architecture
- Domain-Driven Design
- CQRS where specified
- Event-driven architecture where specified
- Twelve-Factor App principles
- OpenTelemetry instrumentation where applicable
- Structured logging
- Security by Design
- Testability
- Dependency injection
- Explicit configuration management
- Clear ownership boundaries
- Approved naming conventions

Language-specific and framework-specific rules must follow the approved Phase 5 Engineering Constitution and coding standards once ingested.

---

## 7. Zero Placeholder Policy

Never generate the following unless explicitly instructed by the user for a temporary scaffold or demonstration:

- `TODO`
- `Coming Soon`
- dummy data
- placeholder API
- fake database
- temporary logic
- stubbed business rules
- fake AI behavior
- mock security behavior
- unimplemented production paths

If information is missing, apply the Never Guess Rule instead of inserting placeholder implementation.

---

## 8. Enterprise Quality Gate

Before marking any feature, service, module, workflow, document, or phase complete, verify:

- Builds successfully
- Passes linting
- Passes type checking where applicable
- Unit tests pass
- Integration tests pass where applicable
- API tests pass where applicable
- Security tests/review complete
- Performance tests complete where applicable
- Documentation updated
- Traceability updated
- ADR references verified
- No architecture drift
- Naming conventions maintained
- Repository structure remains consistent
- Implementation Status updated

No feature is complete until the quality gate is satisfied or an explicit approved exception is recorded.

---

## 9. AI Governance Requirements

Every AI component must include or integrate with approved governance controls for:

- Prompt Registry
- Prompt versioning
- Evaluation tests
- Audit logs
- Human approval / human-in-the-loop review
- Fallback models
- Cost tracking
- Rate limiting
- Observability
- Safety policies
- Explainability
- Source attribution
- Memory governance
- Policy enforcement

Never implement uncontrolled autonomous behavior.

Any missing AI governance detail must be treated as an ambiguity and handled through the Never Guess Rule.

---

## 10. Documentation Synchronization Rule

Every code change must also update applicable documentation, including:

- Architecture documentation
- API documentation
- Database documentation
- Event documentation
- AI agent documentation
- Sequence diagrams
- Deployment documentation
- Change log
- Master Documentation Manifest
- Traceability Matrix
- Implementation Status
- Relevant indexes

Code is never considered complete until documentation is synchronized.

---

## 11. Incremental Delivery Rule

Never attempt to generate the entire system in one response or one uncontrolled implementation pass.

Delivery order:

1. Documentation Review
2. Planning
3. Foundation
4. Infrastructure
5. Shared Libraries
6. Core Services
7. AI Platform
8. Business Services
9. Frontend
10. Testing
11. Deployment
12. Certification

Each stage must preserve traceability and must not proceed past unresolved documentation conflicts without approval.

---

## 12. Git Workflow

Every task must produce or maintain:

- Clear commit message
- Updated documentation
- Updated implementation status
- Traceability update
- Release notes if applicable
- Clean repository status after commit where possible

Commits should be incremental, reviewable, and tied to documented implementation units.

---

## 13. Final Certification Rule

No phase may be marked complete until all of the following are true:

- 100% traceability maintained
- No undocumented services
- No orphan APIs
- No orphan databases
- No orphan events
- No unresolved ADR conflicts
- No architecture drift
- Tests passing
- Security checks complete
- Documentation synchronized
- Production readiness verified where applicable
- Implementation Status updated
- Certification evidence recorded

---

## 14. Communication Standard

For every engineering task, provide:

1. Objective
2. Documentation References
3. Dependency Analysis
4. Proposed Implementation
5. Risks
6. Recommendations
7. Await Approval if required
8. Implementation Summary
9. Test Summary
10. Documentation Updates

---

## 15. Current Certification

As of this governance update:

- No production code has been generated.
- No approved architecture has been changed.
- No APIs have been modified.
- No databases have been modified.
- No ADRs have been modified.
- Repository governance and permanent memory scaffolds have been created.
- Source documentation intake is still pending.

## 16. Source Preservation Layer

Original approved source documents must never be modified. The repository must preserve a source layer and a derived extraction layer:

```text
source/original-pdfs/
source/original-docx/
source/original-images/
source/original-diagrams/
source/checksums/
extracted/ocr-json/
extracted/markdown/
extracted/text/
extracted/images/
```

The preferred ingestion pipeline is:

```text
Original PDF
  ↓
OCR JSON with layout preserved
  ↓
Structured Markdown
  ↓
Indexes and Manifest
  ↓
Implementation Planning
  ↓
Code Generation
```

For full rules, see `docs/governance/SOURCE_PRESERVATION_LAYER.md`.

## 17. Canonical Entity Registry, Retrieval Layer, and Architecture Validation Gate

Before implementation, every major artifact must be assigned a stable canonical identifier through the entity registries under `docs/indexes/`.

Mandatory registries include:

- `ENTITY_REGISTRY.md`
- `SERVICE_REGISTRY.md`
- `DATABASE_REGISTRY.md`
- `API_REGISTRY.md`
- `EVENT_REGISTRY.md`
- `AGENT_REGISTRY.md`
- `UI_SCREEN_REGISTRY.md`
- `WORKFLOW_REGISTRY.md`

Every implementation request must pass through the AI Retrieval Layer and Architecture Validation Gate before code generation.

For full rules, see:

- `docs/governance/AI_RETRIEVAL_LAYER.md`
- `docs/governance/ARCHITECTURE_VALIDATION_GATE.md`
- `templates/IMPLEMENTATION_CARD_TEMPLATE.md`
