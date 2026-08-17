# Implementation Card — CARD-IMP-017-C

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-017-C |
| Implementation Unit | IMP-017-C — AI Agent Fleet: Verification Agents (AGT-017 through AGT-024) |
| Status | Approved |
| Version | 1.0 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-08 |
| Baseline Status | Certified; IMP-001 through IMP-016, IMP-017-A, and IMP-017-B closed and validated |
| Implementation Eligible | Yes |
| Implementation Authorized | Yes (IAG-DECISION-IMP-017-C) |
| Production Code Generation | Permitted within approved IMP-017-C scope only |

## 2. Purpose

Authoritative implementation card for `IMP-017-C`, the third squad of the Phase 2 AI Agent Fleet (Verification Agents `AGT-017` through `AGT-024`), establishing fact-checking, corroboration, source verification, bias detection, and composite confidence scoring across incoming detection results.

## 3. Authorized Scope

- **Verification Agents Squad (`AGT-017` to `AGT-024`):** `Fact-Checking Agent`, `Cross-Reference Verification`, `Source Verification`, `Claim Extraction`, `Evidence Collection`, `Bias Detection`, `Misinformation Flagging`, `Confidence Scoring Agent`.
- **Infrastructure Adapters:** Persistent debunked-claim lookup cache (`DebunkedClaimCache`) with Redis/in-memory TTL storage in `AGT-023`, TLS 1.2+ verified HTTPS fact-checking client (`FactCheckAPIClient`) querying GDELT and Wikidata APIs, and Bayesian domain-weighted confidence aggregation with majority-voting quorum rules in `AGT-024`.
- **Cryptographic Lineage:** SHA-256 evidence chain lineage hashing (`evidence_chain_sha256`) linking raw signal, detection, verification, and evidence IDs.
- **AI Gateway Integration:** gRPC verification routing to Phase 1 `AIGatewayService` (`services/runtime:9090`) with 30-second request deadlines.
- **Event Bus:** Kafka event publishing (`EVT-021` VerificationCompletedEvent) via Sarama `SyncProducer` with JSONL dead-letter queueing (`DLQStats`).
- **Database & RLS:** Additive PostgreSQL schema migration (`20260808320000_verification_schema.up.sql`) creating tables `verification_results`, `claim_extracts`, and `bias_assessments` with `tenant_id UUID NOT NULL` and explicit RLS policies (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`).
- **gRPC & Health Endpoints:** Verification execution (`HandleVerificationRequest`, `HandleBatchVerificationRequest`, `HandleConfidenceAggregationRequest`) and SERVING health status checking on port `9090`.

## 4. Exclusions / Prohibitions

- No implementation of `IMP-017-D` (Pipeline Agents) or `IMP-018` through `IMP-021`;
- No implementation of Phase 3 (`IMP-022+`);
- No modifications permitted to Phase 1 services (`IMP-001` to `IMP-016`), API contracts, existing database tables (`DB-001` to `DB-031`), or prior `IMP-017-A/B` monitor and detector contracts.

## 5. Dependencies

- **Upstream Dependencies:** Requires completion and certification of `IMP-001` through `IMP-016` (immutable tag `phase-1.0.0`), `IMP-017-A` Platform Monitors, and `IMP-017-B` Content Detectors.
- **Runtime Dependencies:** Phase 1 `services/runtime` (`AIGatewayService` on port `9090`), Phase 1 `services/foundation` (RLS tenant authentication), Kafka event brokers, PostgreSQL database, external fact-checking APIs.

## 6. Batch Structure (`C1` through `C8`)

- **Batch C1:** Verification Domain (`VerificationAgent`, `VerificationResult`, `ClaimExtract`, `BiasAssessment`, `EVT-021` event, repository interfaces)
- **Batch C2:** Verification Implementations (`AGT-017` through `AGT-024` in `internal/verification/agent_verification.go`)
- **Batch C3:** Application Layer (`VerificationOrchestrator`, DTOs, Bayesian aggregation & quorum rules, Kafka `EVT-021` wiring)
- **Batch C4:** Infrastructure Layer (`FactCheckAPIClient` with TLS 1.2+ certificate verification, `DebunkedClaimCache`)
- **Batch C5:** Interfaces Layer (`AgentGRPCServer`, SERVING health checks on port `9090`)
- **Batch C6:** Database Migrations (`20260808320000_verification_schema.up.sql` and `down.sql` with RLS)
- **Batch C7:** Tests (Unit, application, and gRPC integration test suites)
- **Batch C8:** Final Verification (All 18 requirements verified, Section 25A GREEN tier maintained)

## 7. Quality Gates & Section 25A Workspace Governance

- **Section 25A Storage Target:** Workspace size must remain in the **GREEN Tier (< 21 MB target for IMP-017-C)**.
- **Verification Matrix:** All 18 discrete requirements (`REQ-017C-001` through `REQ-017C-018`) must be satisfied and verified before batch closure.
