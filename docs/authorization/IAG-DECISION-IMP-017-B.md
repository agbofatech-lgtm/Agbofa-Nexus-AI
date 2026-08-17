# IAG Decision Record — IMP-017-B

| Field | Value |
|---|---|
| Decision ID | IAG-DECISION-IMP-017-B |
| Decision Date | 2026-08-08 |
| Implementation Unit | IMP-017-B — AI Agent Fleet: Content Detectors (AGT-009 through AGT-016) |
| Evaluation Result | Approved |
| Effective Authorization | Granted |
| Authorized By | Agbofa Benjamin |
| Authorization Date | 2026-08-08 (Retroactive Authorization Record) |
| Production Code Generation | Permitted within approved IMP-017-B scope only |

## Decision

```text
IAG Decision: APPROVED
Formal Authorization: GRANTED
Implementation Authorized: YES
Production Code Generation: PERMITTED WITHIN APPROVED IMP-017-B SCOPE ONLY
```

## Authorized Scope

`IMP-017-B` authorization is strictly limited to the second squad of the Phase 2 AI Agent Fleet — Content Detectors:

- 8 Content Detector agents (`AGT-009` Breaking News, `AGT-010` Trend Identification, `AGT-011` Sentiment Analysis, `AGT-012` Source Credibility, `AGT-013` Multimedia Classification, `AGT-014` Language & Locale, `AGT-015` Duplicate & Plagiarism, `AGT-016` Virality Prediction) implemented inside `github.com/agbofa/nexus/services/agents`;
- MinHash / SimHash / Cosine Similarity local Locality-Sensitive Hashing (LSH) deduplication index (`SimilarityIndex`) in `AGT-015`;
- PostgreSQL credibility lookup and temporal reputation decay (`SourceCredibilityRepository`, `PostgresCredibilityRepository`, `ApplyDecay`) in `AGT-012`;
- Detector Conflict Arbitration Engine (`DetectorOrchestrator.ArbitrateDetections`) resolving compatible, contradictory, and ambiguous classifications;
- gRPC LLM analysis routing through Phase 1 `AIGatewayService` (`services/runtime:9090`) with 30s request deadlines;
- Kafka event bus emission for `EVT-020` (`DetectionResultReadyEvent`) via Sarama `SyncProducer` with dead-letter queueing (`DLQStats`);
- Additive PostgreSQL schema migration (`20260808310000_detectors_schema`) for `detection_results` and `source_credibility_scores` with Row-Level Security (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`);
- gRPC server detection endpoints (`HandleDetectionRequest`, `HandleBatchDetectionRequest` SERVING on port `9090`).

## Exclusions

- No implementation of `IMP-017-C` (Verification Agents) or `IMP-017-D` (Pipeline Agents);
- No implementation of `IMP-018` through `IMP-021` or Phase 3 (`IMP-022+`);
- Zero modifications permitted to Phase 1 services (`IMP-001` through `IMP-016`), API contracts, database tables (`DB-001` through `DB-031`), or `IMP-017-A` Platform Monitors.

## Evidence References

- Implementation evidence: `docs/implementation/imp-017/IMP-017-B/IMPLEMENTATION_EVIDENCE.md`
- Batch closure record: `docs/implementation/imp-017/IMP-017-B/BATCH_CLOSURE_RECORD.md`
- Validation report: `docs/implementation/imp-017/IMP-017-B/IMPLEMENTATION_VALIDATION.md`
- Authoritative specification retrieval & gap analysis report
- Requirement checklist: `REQ-017B-001` through `REQ-017B-018`
