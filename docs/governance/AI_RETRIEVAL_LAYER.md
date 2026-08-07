# AI Retrieval Layer

**Purpose:** Ensure every AI-assisted implementation request retrieves only the relevant approved documentation subset before planning or code generation.  
**Status:** Active governance requirement; implementation tooling pending source intake.

---

## 1. Retrieval Principle

Conversation memory is not sufficient for implementation decisions. Every implementation request must be grounded in repository artifacts and approved source documentation.

The AI agent must retrieve the relevant subset of documentation before producing an implementation card or code.

---

## 2. Retrieval Flow

```text
User Request
  ↓
Master Manifest
  ↓
Entity Registry
  ↓
Relevant Volumes
  ↓
Relevant ADRs
  ↓
Relevant APIs
  ↓
Relevant Database / Event / Agent / UI / Workflow Registries
  ↓
Implementation Card
  ↓
Architecture Validation Gate
  ↓
Code Generation
```

---

## 3. Required Retrieval Sources

For every implementation request, inspect applicable artifacts:

- `docs/manifest/MASTER_DOCUMENTATION_MANIFEST.md`
- `docs/indexes/ENTITY_REGISTRY.md`
- `docs/indexes/SERVICE_REGISTRY.md`
- `docs/indexes/API_REGISTRY.md`
- `docs/indexes/DATABASE_REGISTRY.md`
- `docs/indexes/EVENT_REGISTRY.md`
- `docs/indexes/AGENT_REGISTRY.md`
- `docs/indexes/UI_SCREEN_REGISTRY.md`
- `docs/indexes/WORKFLOW_REGISTRY.md`
- `docs/indexes/ADR_INDEX.md`
- `docs/indexes/SECURITY_INDEX.md`
- `docs/indexes/TRACEABILITY_MATRIX.md`
- `docs/indexes/ARCHITECTURE_DRIFT_REGISTER.md`
- Relevant files under `source/` and `extracted/`

---

## 4. Retrieval Rules

1. Retrieve only relevant documentation for the current task.
2. Prefer OCR JSON for layout-aware analysis when available.
3. Use original PDFs as verification baseline.
4. Use structured Markdown for review, diffs, and publication.
5. Never rely only on conversation memory for architecture, API, database, service, AI, security, or workflow decisions.
6. If retrieval does not provide enough information, apply the Never Guess Rule.
7. Record retrieved references in the Implementation Card.
8. Validate retrieved references through the Architecture Validation Gate before implementation.

---

## 5. Retrieval Result Template

| Field | Value |
|---|---|
| User Request | Pending |
| Requirement IDs | Pending |
| Entity IDs | Pending |
| Source Volumes | Pending |
| ADRs | Pending |
| Services | Pending |
| APIs | Pending |
| Databases | Pending |
| Events | Pending |
| AI Agents | Pending |
| UI Screens | Pending |
| Workflows | Pending |
| Security Controls | Pending |
| Ambiguities | Pending |
| Ready for Implementation Card | Pending |

---

## 6. Failure Handling

If the retrieval layer cannot identify the required documentation subset:

1. Stop.
2. Record the missing or ambiguous reference.
3. Update the Architecture Drift Register if implementation could be affected.
4. Recommend possible resolutions.
5. Await approval.
