# IAG Decision Record — IMP-007

| Field | Value |
|---|---|
| Decision ID | IAG-DECISION-IMP-007 |
| Decision Date | 2026-08-08 |
| Implementation Unit | IMP-007 — Content Origination |
| Evaluation Result | Approved |
| Effective Authorization | Granted |
| Authorized By | Agbofa Benjamin |
| Authorization Date | 2026-08-08 |
| Production Code Generation | Permitted within approved IMP-007 scope only |

## Decision

```text
IAG Decision: APPROVED
Formal Authorization: GRANTED
Implementation Authorized: YES
Production Code Generation: PERMITTED WITHIN APPROVED IMP-007 SCOPE ONLY
```

## Authorized Scope

IMP-007 authorization is limited to Content Origination:

- Content Origination Engine (`SVC-030`, `SVC-094`–`SVC-098`);
- News Ingestion Engine and Raw Ingest Documents Store (`SVC-031`, `DB-015`, `API-013`);
- Source Management Service and Source Registry with pgvector (`SVC-032`, `DB-016`);
- Story Detection Engine (`SVC-033`, `API-014`);
- Story Graph Initialization Service boundary adapter (`SVC-034`, `DB-013`);
- Story State Engine (`SVC-035`);
- Content Maestro Supervisor workflow orchestration (`SVC-036`, `WF-016`, `WF-017`, `WF-029`);
- Content origination databases (`DB-013` adapter, `DB-015`, `DB-016`, `DB-026`);
- Content origination APIs (`API-013`, `API-014`, `API-015`, `API-029`);
- Content origination event schemas (`EVT-019`, `EVT-039`);
- integration with closed IMP-001 through IMP-006 foundations.

## Exclusions

This decision does not authorize IMP-008 through IMP-016, Truth Engine business logic (`IMP-008`), Story Graph business logic (`IMP-009`), Content Factory (`IMP-010`), Distribution (`IMP-012`), frontend applications, or production deployment outside later deployment gates.

## Evidence

- `governance/reports/imp-007-fast-track-readiness-matrix.md`
- `implementation-cards/drafts/CARD-IMP-007.md`
- `docs/readiness/fast-track/IMP_007_GAR_DISPOSITION.md`
- `docs/implementation/imp-001/CLOSURE_RECORD.md`
- `docs/implementation/imp-002/CLOSURE_RECORD.md`
- `docs/implementation/imp-003/CLOSURE_RECORD.md`
- `docs/implementation/imp-004/CLOSURE_RECORD.md`
- `docs/implementation/imp-005/CLOSURE_RECORD.md`
- `docs/implementation/imp-006/CLOSURE_RECORD.md`
