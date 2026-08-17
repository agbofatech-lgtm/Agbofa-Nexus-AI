# Implementation Card — CARD-IMP-017-B

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-017-B |
| Implementation Unit | IMP-017-B — AI Agent Fleet: Content Detectors (AGT-009 through AGT-016) |
| Status | Approved |
| Version | 1.0 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-08 |
| Baseline Status | Certified; IMP-001 through IMP-016 and IMP-017-A closed and validated |
| Implementation Eligible | Yes |
| Implementation Authorized | Yes (IAG-DECISION-IMP-017-B) |
| Production Code Generation | Permitted within approved IMP-017-B scope only |

## 2. Purpose

Authoritative implementation card for `IMP-017-B`, the second squad of the Phase 2 AI Agent Fleet (Content Detectors `AGT-009` through `AGT-016`), establishing the classification, virality, sentiment, and deduplication layer across incoming monitor signals.

## 3. Authorized Scope

- **Content Detectors Squad (`AGT-009` to `AGT-016`):** `Breaking News Detector`, `Trend Identification`, `Sentiment Analysis`, `Source Credibility Assessment`, `Multimedia Content Classification`, `Language & Locale Detection`, `Duplicate & Plagiarism Detection`, `Virality Prediction`.
- **Infrastructure Adapters:** MinHash / SimHash local LSH deduplication index (`SimilarityIndex`), PostgreSQL credibility lookup and temporal reputation decay (`SourceCredibilityRepository`, `PostgresCredibilityRepository`, `ApplyDecay`), and Detector Conflict Arbitration Engine (`DetectorOrchestrator.ArbitrateDetections`).
- **AI Gateway Integration:** gRPC analysis routing to Phase 1 `AIGatewayService` (`services/runtime:9090`) with 30-second request deadlines.
- **Event Bus:** Kafka event publishing (`EVT-020` DetectionResultReadyEvent) via Sarama `SyncProducer` with JSONL dead-letter queueing (`DLQStats`).
- **Database & RLS:** Additive PostgreSQL schema migration (`20260808310000_detectors_schema.up.sql`) creating tables `detection_results` and `source_credibility_scores` with `tenant_id UUID NOT NULL` and explicit RLS policies (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`).
- **gRPC & Health Endpoints:** Detection execution (`HandleDetectionRequest`, `HandleBatchDetectionRequest`) and SERVING health status checking on port `9090`.

## 4. Exclusions / Prohibitions

- No implementation of `IMP-017-C` (Verification Agents) or `IMP-017-D` (Pipeline Agents);
- No implementation of `IMP-018` through `IMP-021` or Phase 3 (`IMP-022+`);
- No modifications permitted to Phase 1 services (`IMP-001` to `IMP-016`), API contracts, existing database tables (`DB-001` to `DB-031`), or `IMP-017-A` Platform Monitors.

## 5. Dependencies

- **Upstream Dependencies:** Requires completion and certification of `IMP-001` through `IMP-016` (immutable tag `phase-1.0.0`) and `IMP-017-A` Platform Monitors.
- **Runtime Dependencies:** Phase 1 `services/runtime` (`AIGatewayService` on port `9090`), Phase 1 `services/foundation` (RLS tenant authentication), Kafka event brokers, PostgreSQL database.

## 6. Batch Structure (`B1` through `B8`)

- **Batch B1:** Detector Domain (`DetectorAgent`, `DetectionResult`, `EvidenceItem`, `EVT-020` event, repository interfaces)
- **Batch B2:** Detector Implementations (`AGT-009` through `AGT-016` in `internal/detectors/agent_detector.go`)
- **Batch B3:** Application Layer (`DetectorOrchestrator`, DTOs, conflict arbitration engine, Kafka `EVT-020` wiring)
- **Batch B4:** Infrastructure Layer (`SimilarityIndex` LSH deduplication, `PostgresCredibilityRepository` lookup & temporal decay)
- **Batch B5:** Interfaces Layer (`AgentGRPCServer`, SERVING health checks on port `9090`)
- **Batch B6:** Database Migrations (`20260808310000_detectors_schema.up.sql` and `down.sql` with RLS)
- **Batch B7:** Tests (Unit, application, and gRPC integration test suites)
- **Batch B8:** Final Verification (All 18 requirements verified, Section 25A GREEN tier maintained)

## 7. Quality Gates & Section 25A Workspace Governance

- **Section 25A Storage Target:** Workspace size must remain in the **GREEN Tier (< 20 MB target for IMP-017-B)**.
- **Verification Matrix:** All 18 discrete requirements (`REQ-017B-001` through `REQ-017B-018`) must be satisfied and verified before batch closure.
