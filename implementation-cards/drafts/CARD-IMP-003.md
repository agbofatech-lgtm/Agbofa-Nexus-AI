# Implementation Card — CARD-IMP-003

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-003 |
| Implementation Unit | IMP-003 — Core Platform Foundation |
| Status | Draft |
| Version | 0.1 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-07 |
| Baseline Status | Conditionally Certified; IMP-001 and IMP-002 closed and validated |
| Implementation Eligible | No |
| Implementation Authorized | No |
| Production Code Generation | Prohibited |

## 2. Purpose

Planning-only card for Core Platform Foundation readiness. This unit covers foundation service implementation planning for Tenant & Identity Service and Global Configuration Service boundaries sourced from Volume 11 and related identity/foundation specifications.

## 3. Scope

Planning scope includes:

- Tenant & Identity Service readiness;
- Global Configuration Service readiness;
- foundation database ownership planning;
- foundation gRPC API contract readiness;
- foundation Kafka event contract readiness;
- authentication, token, RLS, Vault, mTLS, Redis configuration and audit-log readiness;
- integration with already-closed IMP-001/IMP-002 foundations.

## 4. Out of Scope

- Production code generation before IAG authorization;
- implementation of services before IAG authorization;
- API Gateway/Event Platform runtime implementation (IMP-004);
- business-domain implementation;
- frontend implementation;
- AI agent implementation;
- production deployment.

## 5. Source Citations

| Citation Type | Reference |
|---|---|
| Volumes | Volume 11, Volume 20, Volume 23 |
| Source Lines / Sections | `source/original-text/volume11/VOLUME11_USER_PROVIDED.txt`; `source/original-text/Agbofa%20Nexus%20Media%20-%20Arena.txt:161160-165537` |
| Registry IDs | SVC-184, SVC-185, SVC-091, SVC-092, SVC-093 |
| API IDs | API-040, API-041, API-028 |
| Database IDs | DB-033, DB-034, DB-035, DB-025 |
| Event IDs | EVT-047, EVT-048, EVT-049, EVT-050, EVT-051, EVT-038 |
| Workflow IDs | WF-028 |
| Traceability IDs | REQ-B3-003 |
| Decision Records | ADR-102, ADR-103, ADR-104, ADR-105 |
| Upstream Closure | `docs/implementation/imp-001/CLOSURE_RECORD.md`; `docs/implementation/imp-002/CLOSURE_RECORD.md` |

## 6. Dependencies

| Dependency Type | IDs / References | Status |
|---|---|---|
| Implementation Units | IMP-001, IMP-002 | Closed and validated |
| Services | SVC-184, SVC-185, SVC-091, SVC-092, SVC-093 | Registered |
| APIs | API-040, API-041, API-028 | Registered |
| Databases | DB-033, DB-034, DB-035, DB-025 | Registered |
| Events | EVT-047, EVT-048, EVT-049, EVT-050, EVT-051, EVT-038 | Registered |
| Workflows | WF-028 | Registered |

## 7. GAR Dependencies

| GAR ID | Status | Impact |
|---|---|---|
| GAR-007 | Closed for source-verification purposes | Volume 11 clean source provided and reviewed. |
| GAR-016 | Accepted decision taxonomy | Decision aliases preserved; verify for IMP-003 before authorization. |

## 8. Validation Requirements

- Fast-track readiness matrix
- Registry validation
- Documentation pipeline validation
- Dependency validation
- Governance validation
- Architecture/IAG evidence package
- Human authorization before implementation

## 9. Acceptance Criteria

- CARD-IMP-003 exists in Draft status.
- IMP-001 and IMP-002 closure evidence exists.
- Volume 11 source verification is cited.
- Foundation service/API/database/event IDs resolve.
- No unresolved direct GAR blocker remains hidden.
- No implementation is authorized by this card.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Foundation service implementation begins before authorization | High | Keep authorization prohibited until IAG approval. |
| API Gateway/Event Platform scope leaks into IMP-003 | High | Keep IMP-004 out of scope. |
| Infrastructure changes leak beyond closed IMP-002 | Medium | Reference closure only; no infra changes in IMP-003 without separate authorization. |

## 11. Blockers

| Blocker | Status | Required Resolution |
|---|---|---|
| Fast-track readiness matrix | Pending | Generate and pass IMP-003 matrix. |
| IAG decision | Not run | Required before implementation. |
| Human authorization | Missing | Required before implementation. |

## 12. Authorization Section

```text
Implementation Eligible: No
Implementation Authorized: No
Production Code Generation: Prohibited
```

## 13. No-Code Certification

This card is a planning/readiness artifact only. No foundation service implementation, API implementation, database migration, event implementation, deployment artifact, or production code is authorized by this card.
