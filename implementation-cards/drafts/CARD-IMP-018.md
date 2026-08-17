# Implementation Card — CARD-IMP-018

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-018 |
| Implementation Unit | IMP-018 — Predictive Intelligence (PRED-001 through PRED-005) |
| Status | Approved |
| Version | 1.0 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-08 |
| Baseline Status | Certified; IMP-001 through IMP-016 and IMP-017 (32-agent fleet) closed and validated |
| Implementation Eligible | Yes |
| Implementation Authorized | Yes (IAG-DECISION-IMP-018) |
| Production Code Generation | Permitted within approved IMP-018 scope only |

## 2. Purpose

Authoritative implementation card for `IMP-018`, the second major unit of Phase 2 (Predictive Intelligence `PRED-001` through `PRED-005`), delivering virality forecasting, engagement optimization, trend lifecycle time-series modeling, content performance forecasting, and platform anomaly detection.

## 3. Authorized Scope

- **Predictive Intelligence Engines (`PRED-001` to `PRED-005`):** `Story Virality Prediction Engine`, `Audience Engagement Optimization Engine`, `Trend Lifecycle Modeling Engine`, `Content Performance Forecasting Engine`, `Anomaly Detection Engine`.
- **Infrastructure Adapters:** Time-series historical trend client (`TrendStoreAPIClient`), concrete PostgreSQL predictive repository (`PostgresPredictiveRepository`) persisting all 5 prediction types, and Phase 1 analytics client (`Phase1GRPCClients.CollectOptimizationSignals`).
- **Master Orchestration:** `PredictionOrchestrator` managing engine execution, analytics signal consumption (`EVT-034`–`EVT-037`), prediction conflict arbitration (`ArbitratePredictions`), and damped learning feedback loops.
- **Feedback Loop Controller:** `FeedbackLoopController` enforcing learning rate `0.15`, delta clamp `[-0.10, +0.10]`, and 24-hour cumulative adjustment cap `0.30` targeting `AGT-010`, `AGT-016`, and `AGT-024`.
- **Deterministic State Machines:** `TrendLifecycleStateMachine` evaluating EMA velocity ($\alpha=0.3$) across 5 lifecycle phases (`EMERGENCE`, `ACCELERATION`, `PEAK`, `DECAY`, `RESURGENCE`); `StatisticalAnomalyDetector` evaluating Z-Score $> 3.0$ or velocity ratio $> 5.0$ with LLM confirmation.
- **MAPE Calibration Ledger:** `CalibrationLedger.RecordActual` tracking Mean Absolute Percentage Error and warning when average MAPE $> 30\%$.
- **Database & RLS:** Additive PostgreSQL schema migrations (`20260808340000`, `350000`, `370000`) for tables `virality_predictions`, `trend_lifecycle_models`, `content_performance_forecasts`, `anomaly_detection_events`, and `engagement_optimizations` with `tenant_id UUID NOT NULL` and explicit RLS policies (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`).
- **gRPC & Health Endpoints:** Predictive execution (`HandlePredictiveRequest`) and SERVING health status checking on port `9090`.

## 4. Exclusions / Prohibitions

- No implementation of `IMP-019` (Advanced Personalization), `IMP-020` (Multimodal Intelligence), or `IMP-021` (Monetization Engine);
- No implementation of Phase 3 (`IMP-022+`);
- No modifications permitted to Phase 1 services (`IMP-001` to `IMP-016`), API contracts, existing database tables (`DB-001` to `DB-031`), or `IMP-017` 32-agent fleet contracts.

## 5. Dependencies

- **Upstream Dependencies:** Requires completion and certification of `IMP-001` through `IMP-016` (immutable tag `phase-1.0.0`) and `IMP-017` (32 AI Agents).
- **Runtime Dependencies:** Phase 1 `services/runtime` (`AIGatewayService` on port `9090`), Phase 1 `services/analytics`, Kafka event brokers, PostgreSQL database, ClickHouse/time-series trend store.

## 6. Batch Structure (`E1` through `E8`)

- **Batch E1:** Predictive Domain (`PredictiveEngine`, prediction structs, `TrendPhase` constants, `EVT-038` event, repository interfaces)
- **Batch E2:** Prediction Engines (`PRED-001` through `PRED-005` in `internal/predictive/engine_predictive.go`, `IndustryPrior`, `TrendLifecycleStateMachine`, `StatisticalAnomalyDetector`)
- **Batch E3:** Application Layer (`PredictionOrchestrator`, DTOs, `FeedbackLoopController`, conflict arbitration, 3600s SLA check)
- **Batch E4:** Infrastructure Layer (`TrendStoreAPIClient`, `PostgresPredictiveRepository`, Kafka `EVT-038` publisher)
- **Batch E5:** Interfaces Layer (`AgentGRPCServer`, SERVING health checks on port `9090`)
- **Batch E6:** Database Migrations (`20260808340000`, `350000`, `370000` with RLS)
- **Batch E7:** Tests (Unit, application, and gRPC integration test suites)
- **Batch E8:** Final Verification (All 20 requirements verified, Section 25A GREEN tier maintained)

## 7. Quality Gates & Section 25A Workspace Governance

- **Section 25A Storage Target:** Workspace size must remain in the **GREEN Tier (< 20 MB target for IMP-018)**.
- **Verification Matrix:** All 20 discrete requirements (`REQ-018-001` through `REQ-018-020`) must be satisfied and verified before unit closure.
