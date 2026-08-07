# Agbofa Nexus AI Documentation Repository

**Project:** Agbofa Nexus AI — Autonomous AI Media Company Platform  
**Company:** Agbofa Technologies  
**Documentation Status:** Enterprise Architecture Approved; Implementation Ready; Phase 5 Documentation  
**Repository Purpose:** Enterprise documentation organization, review, indexing, and publication.

## Documentation Governance

This repository is used to reorganize and publish the approved Agbofa Nexus AI documentation baseline without changing technical intent.

The governing workflow is:

```text
Recommendation → Approval → Implementation
```

No structural or editorial modifications are applied to approved volumes until the relevant recommendation report has been reviewed and approved.

## Repository Structure

```text
Agbofa-Nexus-AI/
├── 01-Enterprise-Architecture/
│   ├── Volume-01/
│   ├── Volume-02/
│   └── ... Volume-37/
├── 02-Implementation-Specifications/
├── 03-Frontend/
├── 04-Infrastructure/
├── 05-Coding-Standards/
├── docs/
│   ├── adr/
│   ├── diagrams/
│   ├── indexes/
│   └── manifest/
├── assets/
├── templates/
├── incoming/
├── review-reports/
├── publication/
└── README.md
```

## Processing Batches

| Batch | Scope | Status |
|---|---:|---|
| Batch 1 | Volumes 1–10 | Pending source intake |
| Batch 2 | Volumes 11–20 | Pending |
| Batch 3 | Volumes 21–30 | Pending |
| Batch 4 | Volumes 31–37 + Phase 5 Documents | Pending |

## Preservation Rules

The following must not be changed by the documentation publishing process:

- Architecture
- Business logic
- APIs
- Database schemas
- Technology stack
- ADR decisions
- Workflows
- Security model
- AI architecture
- Implementation specifications

## Permitted Improvements After Approval

- Formatting
- Navigation
- Readability
- Grammar
- Numbering
- Cross-references
- Tables
- Diagrams
- Indexes
- Glossary and acronym normalization

## Enterprise Engineering Operating Mode

The Agbofa Nexus AI documentation is the single source of truth. All engineering work must follow:

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

No production code may be generated from assumptions. Every implementation must preserve traceability and must update the permanent memory indexes when required.

### Permanent Memory Artifacts

- `MASTER_DOCUMENTATION_MANIFEST.md`
- `TRACEABILITY_MATRIX.md`
- `SERVICE_INDEX.md`
- `API_INDEX.md`
- `DATABASE_INDEX.md`
- `AGENT_INDEX.md`
- `EVENT_INDEX.md`
- `SECURITY_INDEX.md`
- `IMPLEMENTATION_STATUS.md`
- `ARCHITECTURE_DRIFT_REGISTER.md`

## Strengthened Governance Rules

All AI-assisted engineering work is governed by:

```text
docs/governance/ENGINEERING_CONSTITUTION.md
```

Mandatory additions include:

- Never Guess Rule
- Repository Memory Rule
- Coding Constitution
- Zero Placeholder Policy
- Enterprise Quality Gate
- AI Governance Requirements
- Documentation Synchronization Rule
- Incremental Delivery Rule
- Git Workflow
- Final Certification Rule

## Permanent Enterprise Engineering Agent Charter

This repository is governed by the permanent agent charter:

```text
docs/governance/PERMANENT_ENTERPRISE_ENGINEERING_AGENT_CHARTER.md
```

The agent remains responsible for architectural integrity, engineering standards, traceability, documentation synchronization, repository consistency, testing, quality gates, release readiness, and architecture drift prevention for the duration of the project unless explicitly instructed otherwise.

## Source Preservation Layer

Original approved documents are preserved under `source/` and are never edited directly. Derived artifacts are stored under `extracted/`.

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

Preferred pipeline:

```text
Original PDF → OCR JSON → Structured Markdown → Indexes & Manifest → Implementation Planning → Code Generation
```

Full governance: `docs/governance/SOURCE_PRESERVATION_LAYER.md`

## Canonical Registries, Retrieval, and Validation

Before implementation, every major artifact must have a stable canonical ID and every implementation request must retrieve relevant documentation and pass an architecture validation gate.

Key artifacts:

```text
docs/indexes/ENTITY_REGISTRY.md
docs/indexes/SERVICE_REGISTRY.md
docs/indexes/DATABASE_REGISTRY.md
docs/indexes/API_REGISTRY.md
docs/indexes/EVENT_REGISTRY.md
docs/indexes/AGENT_REGISTRY.md
docs/indexes/UI_SCREEN_REGISTRY.md
docs/indexes/WORKFLOW_REGISTRY.md
docs/governance/AI_RETRIEVAL_LAYER.md
docs/governance/ARCHITECTURE_VALIDATION_GATE.md
templates/IMPLEMENTATION_CARD_TEMPLATE.md
```

Implementation flow:

```text
User Request → Master Manifest → Entity Registries → Relevant Source Docs → Implementation Card → Architecture Validation Gate → Code Generation
```
