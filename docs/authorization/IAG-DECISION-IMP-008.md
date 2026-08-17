# IAG Decision Record — IMP-008

| Field | Value |
|---|---|
| Decision ID | IAG-DECISION-IMP-008 |
| Decision Date | 2026-08-08 |
| Implementation Unit | IMP-008 — Truth Engine |
| Evaluation Result | Approved |
| Effective Authorization | Granted |
| Authorized By | Agbofa Benjamin |
| Authorization Date | 2026-08-08 |
| Production Code Generation | Permitted within approved IMP-008 scope only |

## Decision

```text
IAG Decision: APPROVED
Formal Authorization: GRANTED
Implementation Authorized: YES
Production Code Generation: PERMITTED WITHIN APPROVED IMP-008 SCOPE ONLY
```

## Authorized Scope

IMP-008 authorization is limited to Truth Engine:

- Core Truth Engine verification services (`SVC-037`–`SVC-042`: Source Verification, Cross-Source Validation, Claim Verification, Fact-Checking, Misinformation Detection, Duplicate Story Detection);
- Truth validation capabilities (`SVC-044`–`SVC-046`: Confidence Engine, Editorial Decision Engine, Truth Provenance & Audit Trail);
- Volume 25 codebase specification services (`SVC-099`–`SVC-108`);
- Truth Story Graph boundary adapter (`SVC-043`, `DB-013` boundary);
- Truth Engine databases and ledgers (`DB-014`, `DB-027`);
- Truth Engine APIs (`API-016`, `API-017`, `API-018`, `API-030`);
- Truth Engine event consumers/producers (`EVT-019` consumer, `EVT-021`–`EVT-026`, `EVT-040`);
- Truth Engine workflow orchestration (`WF-018`, `WF-019`, `WF-030`);
- integration with closed IMP-001 through IMP-007 foundations (using IMP-006 AI Gateway runtime and IMP-007 Content Origination `EVT-019` input boundary).

## Exclusions

This decision does not authorize IMP-009 through IMP-016, Story Graph business logic (`IMP-009`), Content Factory (`IMP-010`), Distribution (`IMP-012`), Reader (`IMP-014`), Newsroom application (`IMP-015`), or production deployment outside later deployment gates.

## Evidence

- `governance/reports/imp-008-fast-track-readiness-matrix.md`
- `implementation-cards/drafts/CARD-IMP-008.md`
- `docs/readiness/fast-track/IMP_008_GAR_DISPOSITION.md`
- `docs/implementation/imp-001/CLOSURE_RECORD.md`
- `docs/implementation/imp-002/CLOSURE_RECORD.md`
- `docs/implementation/imp-003/CLOSURE_RECORD.md`
- `docs/implementation/imp-004/CLOSURE_RECORD.md`
- `docs/implementation/imp-005/CLOSURE_RECORD.md`
- `docs/implementation/imp-006/CLOSURE_RECORD.md`
- `docs/implementation/imp-007/CLOSURE_RECORD.md`
