# IAG Decision Record — IMP-012

| Field | Value |
|---|---|
| Decision ID | IAG-DECISION-IMP-012 |
| Decision Date | 2026-08-08 |
| Implementation Unit | IMP-012 — Distribution Engine |
| Evaluation Result | Approved |
| Effective Authorization | Granted |
| Authorized By | Agbofa Benjamin |
| Authorization Date | 2026-08-08 |
| Production Code Generation | Permitted within approved IMP-012 scope only |

## Decision

```text
IAG Decision: APPROVED
Formal Authorization: GRANTED
Implementation Authorized: YES
Production Code Generation: PERMITTED WITHIN APPROVED IMP-012 SCOPE ONLY
```

## Authorized Scope

IMP-012 authorization is limited to Distribution Engine:

- Distribution Engine core services (`SVC-065`–`SVC-074`: Distribution Engine, Publication Orchestrator, Platform Connector Framework, Scheduling & Campaign Engine, Breaking News Delivery Service, Story Update & Synchronization Service, Correction & Retraction Engine, Delivery Monitoring Service, Distribution Analytics Feedback Service, Publishing Queue System);
- Volume 28 codebase specification services (`SVC-127`–`SVC-133`);
- Publication Event Store (`DB-019`);
- Distribution Engine APIs (`API-021`, `API-033`);
- Distribution events (`EVT-024` consumer, `EVT-027`–`EVT-033`, `EVT-043` producers);
- Distribution workflows (`WF-023`, `WF-033`);
- integration with closed IMP-001 through IMP-011 foundations (using IMP-006 AI Gateway runtime `github.com/agbofa/nexus/libs/go/pkg/llm` and IMP-011 Compliance Gatekeeper boundary).

## Exclusions

This decision does not authorize IMP-013 through IMP-016, Analytics & Audience Intelligence (`IMP-013`), Reader (`IMP-014`), Newsroom application (`IMP-015`), or production deployment outside later deployment gates.

## Evidence

- `governance/reports/imp-012-fast-track-readiness-matrix.md`
- `implementation-cards/drafts/CARD-IMP-012.md`
- `docs/readiness/fast-track/IMP_012_GAR_DISPOSITION.md`
- `docs/implementation/imp-001/CLOSURE_RECORD.md`
- `docs/implementation/imp-002/CLOSURE_RECORD.md`
- `docs/implementation/imp-003/CLOSURE_RECORD.md`
- `docs/implementation/imp-004/CLOSURE_RECORD.md`
- `docs/implementation/imp-005/CLOSURE_RECORD.md`
- `docs/implementation/imp-006/CLOSURE_RECORD.md`
- `docs/implementation/imp-007/CLOSURE_RECORD.md`
- `docs/implementation/imp-008/CLOSURE_RECORD.md`
- `docs/implementation/imp-009/CLOSURE_RECORD.md`
- `docs/implementation/imp-010/CLOSURE_RECORD.md`
- `docs/implementation/imp-011/CLOSURE_RECORD.md`
