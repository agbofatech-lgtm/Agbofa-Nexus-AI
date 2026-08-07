# Architecture Validation Gate

**Purpose:** Mandatory pre-code validation checklist for every implementation card.  
**Status:** Active; applies before any production code generation.

---

## 1. Gate Principle

No implementation may proceed from an Implementation Card to Code Generation until the Architecture Validation Gate passes or an explicit approved exception is recorded.

If any item fails:

```text
STOP.
```

Then record the failure, explain impact, recommend resolution, and await approval.

---

## 2. Validation Flow

```text
Implementation Card
  ↓
Architecture Validation Gate
  ├── Requirement verified
  ├── Source volume verified
  ├── ADR verified
  ├── Service owner verified
  ├── API verified
  ├── Database ownership verified
  ├── Event contracts verified
  ├── Security requirements verified
  ├── Tests identified
  └── Documentation links verified
  ↓
Code Generation
```

---

## 3. Mandatory Checklist

| Gate Item | Required Evidence | Source Artifact | Status | Notes |
|---|---|---|---|---|
| Requirement verified | Requirement ID and source reference exist | TRACEABILITY_MATRIX.md | Pending | Required before implementation |
| Source volume verified | Volume/page/section identified | MASTER_DOCUMENTATION_MANIFEST.md | Pending | Required before implementation |
| ADR verified | Related ADRs identified or no ADR applicable recorded | ADR_INDEX.md | Pending | Required before implementation |
| Entity registered | Canonical entity ID assigned | ENTITY_REGISTRY.md | Pending | Required before implementation |
| Service owner verified | Owning service and bounded context confirmed | SERVICE_REGISTRY.md / SERVICE_INDEX.md | Pending | Required for service work |
| API verified | API contract exists and owner confirmed | API_REGISTRY.md / API_INDEX.md | Pending | Required for API work |
| Database ownership verified | Database owner and schema/collection/graph ownership confirmed | DATABASE_REGISTRY.md / DATABASE_INDEX.md | Pending | Required for persistence work |
| Event contracts verified | Event names, topics, producers, consumers, and payloads confirmed | EVENT_REGISTRY.md / EVENT_INDEX.md | Pending | Required for event-driven work |
| AI agent verified | Agent role, tools, prompts, governance, memory scope confirmed | AGENT_REGISTRY.md / AGENT_INDEX.md | Pending | Required for AI-agent work |
| UI screen verified | Screen, route, audience, APIs, workflows confirmed | UI_SCREEN_REGISTRY.md | Pending | Required for frontend work |
| Workflow verified | Trigger, participants, services, states, controls confirmed | WORKFLOW_REGISTRY.md | Pending | Required for workflow work |
| Security requirements verified | Applicable controls identified | SECURITY_INDEX.md | Pending | Required for all implementation |
| Tests identified | Unit/integration/API/security/performance tests specified | Implementation Card | Pending | Required for all implementation |
| Documentation links verified | Docs to update identified | Manifest and indexes | Pending | Required for all implementation |
| Architecture drift check | No unresolved conflicts | ARCHITECTURE_DRIFT_REGISTER.md | Pending | Required before implementation |

---

## 4. Gate Result

| Field | Value |
|---|---|
| Implementation Card ID | Pending |
| Gate Date | Pending |
| Gate Reviewer | Enterprise Engineering Agent / Human Approver |
| Result | Pending |
| Exceptions | Pending |
| Approval Reference | Pending |

---

## 5. Failure Handling

If the validation gate fails:

1. Stop implementation.
2. Record failure in the implementation card.
3. Record architectural issue in `ARCHITECTURE_DRIFT_REGISTER.md` if applicable.
4. Update `IMPLEMENTATION_STATUS.md`.
5. Produce impact report.
6. Await approval.
