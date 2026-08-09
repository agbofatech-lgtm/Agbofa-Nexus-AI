# Implementation Card — CARD-IMP-017-D

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-017-D |
| Implementation Unit | IMP-017-D — AI Agent Fleet: Pipeline Agents (AGT-025 through AGT-032) |
| Status | Approved |
| Version | 1.0 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-08 |
| Baseline Status | Certified; IMP-001 through IMP-016, IMP-017-A, IMP-017-B, and IMP-017-C closed and validated |
| Implementation Eligible | Yes |
| Implementation Authorized | Yes (IAG-DECISION-IMP-017-D) |
| Production Code Generation | Permitted within approved IMP-017-D scope only |

## 2. Purpose

Authoritative implementation card for `IMP-017-D`, the fourth and final squad of the Phase 2 AI Agent Fleet (Pipeline Agents `AGT-025` through `AGT-032`), establishing end-to-end stage flow control across all 32 agents and integration with all 10 Phase 1 services.

## 3. Authorized Scope

- **Pipeline Agents Squad (`AGT-025` to `AGT-032`):** `Content Ingestion Orchestrator`, `Story Graph Updater`, `Factory Intake Router`, `Compliance Pre-Checker`, `Distribution Scheduler`, `Analytics Collector`, `Learning Feedback Loop`, `Operations Monitor`.
- **Infrastructure Adapters:** Parameterized Neo4j Cypher write transactions (`UpdateStoryGraph`) and compensating saga rollbacks (`RollbackStoryGraph`) in `Neo4jGraphClient`, Phase 1 gRPC connection pooling (`Phase1GRPCClients`), kill-switch circuit breaker (`FleetCircuitBreaker`), durable checkpoints, backpressure work queue (capacity 1000), Anomaly Quarantine Gate, and damped learning feedback loop.
- **Master Orchestrator:** `PipelineOrchestrator` managing all 32 agents (`AGT-001` through `AGT-032`) and enforcing stage flow control (`INGESTION` through `OPERATIONS`).
- **Event Bus:** Kafka event publishing (`EVT-025` ComplianceClearanceEvent, `EVT-045` PipelineExecutionEvent) via Sarama `SyncProducer` with JSONL dead-letter queueing (`DLQStats`).
- **Database & RLS:** Additive PostgreSQL schema migration (`20260808330000_pipeline_schema.up.sql`) creating tables `pipeline_states`, `pipeline_audit_log`, and `feedback_loop_signals` with `tenant_id UUID NOT NULL` and explicit RLS policies (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`).
- **gRPC & Health Endpoints:** Pipeline execution (`HandlePipelineRequest`, `HandleFleetHealthRequest`) and SERVING health status checking on port `9090`.

## 4. Exclusions / Prohibitions

- No implementation of `IMP-018` through `IMP-021` or Phase 3 (`IMP-022+`);
- No modifications permitted to Phase 1 services (`IMP-001` to `IMP-016`), API contracts, existing database tables (`DB-001` to `DB-031`), or prior `IMP-017-A/B/C` contracts.

## 5. Dependencies

- **Upstream Dependencies:** Requires completion and certification of `IMP-001` through `IMP-016` (immutable tag `phase-1.0.0`), `IMP-017-A` Platform Monitors, `IMP-017-B` Content Detectors, and `IMP-017-C` Verification Agents.
- **Runtime Dependencies:** All 10 Phase 1 microservices on port `9090`, Neo4j graph store, Kafka event brokers, PostgreSQL database, Redis rate limiter store.

## 6. Batch Structure (`D1` through `D8`)

- **Batch D1:** Pipeline Domain (`PipelineAgent`, `PipelineStage`, `PipelineState`, `EVT-025`/`045` events, repository interfaces)
- **Batch D2:** Pipeline Implementations (`AGT-025` through `AGT-032` in `internal/pipeline/agent_pipeline.go`)
- **Batch D3:** Application Layer (`PipelineOrchestrator`, DTOs, stage flow control, durable checkpoints, saga coordinator, Kafka wiring)
- **Batch D4:** Infrastructure Layer (`Neo4jGraphClient` with Cypher & saga rollback, `Phase1GRPCClients` pool)
- **Batch D5:** Interfaces Layer (`AgentGRPCServer`, SERVING health checks on port `9090`)
- **Batch D6:** Database Migrations (`20260808330000_pipeline_schema.up.sql` and `down.sql` with RLS)
- **Batch D7:** Tests (Unit, application, and gRPC integration test suites)
- **Batch D8:** Final Verification (All 20 requirements verified, Section 25A GREEN tier maintained, master closure record created)

## 7. Quality Gates & Section 25A Workspace Governance

- **Section 25A Storage Target:** Workspace size must remain in the **GREEN Tier (< 22 MB target for IMP-017-D)**.
- **Verification Matrix:** All 20 discrete requirements (`REQ-017D-001` through `REQ-017D-020`) must be satisfied and verified before batch closure.
