# Implementation Card — CARD-IMP-006

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-006 |
| Implementation Unit | IMP-006 — AI Gateway, Prompt, Model & Agent Runtime Foundation |
| Status | Draft |
| Version | 0.1 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-08 |
| Baseline Status | Conditionally Certified; IMP-001 through IMP-005 closed and validated |
| Implementation Eligible | No |
| Implementation Authorized | No |
| Production Code Generation | Prohibited |

## 2. Purpose

Planning-only card for AI Gateway, Prompt, Model & Agent Runtime Foundation readiness.

## 3. Scope

Planning scope includes LLM gateway/model routing foundation, prompt registry/versioning foundation, model/provider abstraction foundation, agent runtime foundation, AI governance alignment, audit/evaluation hooks, and integration with closed repository, infrastructure, core platform, API/event, and identity foundations.

## 4. Out of Scope

- Production code generation before IAG authorization;
- business-domain AI agents;
- Truth Engine implementation;
- Content Factory implementation;
- Story Graph implementation;
- frontend implementation;
- production deployment.

## 5. Source Citations

| Citation Type | Reference |
|---|---|
| Volumes | Volume 4, Volume 5, Volume 21, Volume 22, Volume 30, Phase 5 Documents 1–3 |
| Registry IDs | SVC-016, SVC-143, SVC-144, SVC-182, SVC-183; AGT-001–AGT-028 |
| API IDs | API-005, API-009, API-035, API-039 |
| Database IDs | DB-009, DB-010, DB-011, DB-031 |
| Event IDs | EVT-045 |
| Traceability IDs | REQ-B1-008, REQ-B1-009, REQ-B1-010, REQ-B1-011, REQ-B1-012, REQ-B1-013, REQ-B3-010, REQ-B4-006, REQ-B4-007 |
| Decision Records | ADR-010, ADR-011, ADR-012, ADR-013, ADR-030, ADR-033, ADR-034, ADR-035, ADR-036, ADR-096, ADR-118, ADR-127, ADR-128 |
| Upstream Closure | `docs/implementation/imp-001/CLOSURE_RECORD.md` through `docs/implementation/imp-005/CLOSURE_RECORD.md` |

## 6. Dependencies

| Dependency Type | IDs / References | Status |
|---|---|---|
| Implementation Units | IMP-001, IMP-002, IMP-003, IMP-004, IMP-005 | Closed and validated |
| Services | SVC-016, SVC-143, SVC-144, SVC-182, SVC-183 | Registered |
| APIs | API-005, API-009, API-035, API-039 | Registered |
| Databases | DB-009, DB-010, DB-011, DB-031 | Registered |
| Events | EVT-045 | Registered |

## 7. GAR Dependencies

| GAR ID | Status | Impact |
|---|---|---|
| GAR-001 | Provisionally accepted | Phase-aware technology mapping applies. |
| GAR-006 | Closed by Phase 5 Document 2 source | Not a blocker for IMP-006 readiness. |
| GAR-011 | Provisionally accepted | Decision index alias preservation applies. |
| GAR-013 | Closed for governance hierarchy | Not a blocker for IMP-006 readiness. |
| GAR-014 | Closed by Phase 5 Document 2 source | Not a blocker for IMP-006 readiness. |
| GAR-016 | Accepted decision taxonomy | Decision aliases preserved. |

## 8. Authorization Section

```text
Implementation Eligible: No
Implementation Authorized: No
Production Code Generation: Prohibited
```

## 9. No-Code Certification

This card is a readiness artifact only and does not authorize AI runtime, model gateway, prompt registry, agent runtime, business AI agents, frontend, or production deployment implementation.
