# Implementation Card — CARD-IMP-004

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-004 |
| Implementation Unit | IMP-004 — API Gateway & Event Platform |
| Status | Draft |
| Version | 0.1 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-07 |
| Baseline Status | Conditionally Certified; IMP-001, IMP-002 and IMP-003 closed and validated |
| Implementation Eligible | No |
| Implementation Authorized | No |
| Production Code Generation | Prohibited |

## 2. Purpose

Planning-only card for API Gateway & Event Platform readiness.

## 3. Scope

Planning scope includes:

- API Gateway foundation readiness;
- REST, GraphQL, WebSocket and SSE boundary planning;
- API gateway infrastructure integration planning;
- event bus and enterprise event platform readiness;
- event persistence/replay boundary planning;
- Kafka/event contract readiness;
- dependency integration with IMP-001, IMP-002 and IMP-003.

## 4. Out of Scope

- Production code generation before IAG authorization;
- runtime API Gateway implementation before IAG authorization;
- event platform runtime implementation before IAG authorization;
- business-domain services;
- frontend implementation;
- AI agent implementation;
- production deployment.

## 5. Source Citations

| Citation Type | Reference |
|---|---|
| Volumes | Volume 3, Volume 20, Volume 30, Volume 31, Phase 5 Document 2 |
| Source Lines / Sections | `source/original-text/Agbofa%20Nexus%20Media%20-%20Arena.txt:12924-12995`; `source/original-text/Agbofa%20Nexus%20Media%20-%20Arena.txt:14186-14235`; `source/original-text/Agbofa%20Nexus%20Media%20-%20Arena.txt:148205-152876`; `source/original-text/Agbofa%20Nexus%20Media%20-%20Arena.txt:200036-207478`; `source/original-text/phase5/PHASE5_DOCUMENT2_USER_PROVIDED.txt` |
| Registry IDs | SVC-001, SVC-013, SVC-145, SVC-154, SVC-155 |
| API IDs | API-001, API-002, API-003, API-004, API-036 |
| Database IDs | DB-006, DB-032 |
| Event IDs | EVT-001, EVT-017, EVT-045, EVT-046 |
| Workflow IDs | WF-002, WF-024, WF-035, WF-036 |
| Traceability IDs | REQ-B1-004, REQ-B1-005, REQ-B3-010, REQ-B4-001 |
| Decision Records | ADR-001, ADR-006, ADR-007, ADR-071, ADR-119, ADR-122, ADR-129, ADR-130 |
| Upstream Closure | `docs/implementation/imp-001/CLOSURE_RECORD.md`; `docs/implementation/imp-002/CLOSURE_RECORD.md`; `docs/implementation/imp-003/CLOSURE_RECORD.md` |

## 6. Dependencies

| Dependency Type | IDs / References | Status |
|---|---|---|
| Implementation Units | IMP-001, IMP-002, IMP-003 | Closed and validated |
| Services / Components | SVC-001, SVC-013, SVC-145, SVC-154, SVC-155 | Registered |
| APIs | API-001, API-002, API-003, API-004, API-036 | Registered |
| Databases / Stores | DB-006, DB-032 | Registered |
| Events | EVT-001, EVT-017, EVT-045, EVT-046 | Registered |
| Workflows | WF-002, WF-024, WF-035, WF-036 | Registered |

## 7. GAR Dependencies

| GAR ID | Status | Impact |
|---|---|---|
| GAR-001 | Provisionally accepted | Phase-aware technology mapping applies. |
| GAR-008 | Dispositioned for IMP-002; applicable GitOps watch item only | Not a direct blocker for IMP-004 readiness. |
| GAR-009 | Dispositioned for IMP-002; service mesh family preserved | Not a direct blocker for IMP-004 readiness. |
| GAR-016 | Accepted decision taxonomy | Decision aliases preserved. |

## 8. Validation Requirements

- Fast-track readiness matrix
- Registry validation
- Documentation pipeline validation
- Dependency validation
- Governance validation
- IAG evidence package
- Human authorization before implementation

## 9. Acceptance Criteria

- CARD-IMP-004 exists in Draft status.
- IMP-001, IMP-002 and IMP-003 closure evidence exists.
- API Gateway and Event Platform registry references resolve.
- No unresolved direct GAR blocker remains hidden.
- No implementation is authorized by this card.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| API Gateway work expands into business API implementation | High | Keep business-domain APIs out of scope. |
| Event Platform work expands into business event handlers | High | Keep domain event producers/consumers out of scope. |
| Deployment scope exceeds foundation controls | Medium | Production deployment remains prohibited without later release gate. |

## 11. Authorization Section

```text
Implementation Eligible: No
Implementation Authorized: No
Production Code Generation: Prohibited
```

## 12. No-Code Certification

This card is a planning/readiness artifact only. No API Gateway runtime, event platform runtime, business API, business event handler, database implementation, deployment artifact, frontend, or AI agent implementation is authorized by this card.
