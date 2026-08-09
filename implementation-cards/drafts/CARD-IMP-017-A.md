# Implementation Card — CARD-IMP-017-A

## 1. Card Metadata

| Field | Value |
|---|---|
| Card ID | CARD-IMP-017-A |
| Implementation Unit | IMP-017-A — AI Agent Fleet: Platform Monitors (AGT-001 through AGT-008) |
| Status | Approved |
| Version | 1.0 |
| Owner | Enterprise Engineering Agent / Human Approver |
| Date | 2026-08-08 |
| Baseline Status | Certified; IMP-001 through IMP-016 closed and validated (phase-1.0.0) |
| Implementation Eligible | Yes |
| Implementation Authorized | Yes (IAG-DECISION-IMP-017-A) |
| Production Code Generation | Permitted within approved IMP-017-A scope only |

## 2. Purpose

Authoritative implementation card for `IMP-017-A`, the first squad of the Phase 2 AI Agent Fleet (Platform Monitors `AGT-001` through `AGT-008`), establishing the operational monitoring layer across social media and emerging content platforms.

## 3. Authorized Scope

- **Platform Monitors Squad (`AGT-001` to `AGT-008`):** `Twitter/X`, `Facebook`, `Instagram`, `TikTok`, `LinkedIn`, `YouTube`, `Reddit`, `Emerging Platforms / RSS`.
- **Infrastructure Adapters:** Live HTTP/REST/OAuth2 social platform client adapters (`PlatformAPIClient`), OAuth2 token rotation manager (`TokenManager`), Redis Lua atomic token-bucket rate limiter (`PlatformRateLimiter`), adversarial flood protection (`FloodDetector`), and exponential backoff retry differentiation (`domain.RetryWithBackoff`).
- **AI Gateway Integration:** gRPC routing to Phase 1 `AIGatewayService` (`services/runtime:9090`) with 30-second request deadlines.
- **Event Bus:** Kafka event publishing (`EVT-019` MonitorSignalDetected, `EVT-039` TrendingTopicFound) via Sarama `SyncProducer` with JSONL dead-letter queueing (`DLQStats`).
- **Database & RLS:** Additive PostgreSQL schema migration (`20260808300000_agents_schema.up.sql`) creating tables `agents_state`, `monitor_signals`, and `trending_topics` with `tenant_id UUID NOT NULL` and explicit RLS policies (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`).
- **gRPC & Health Endpoints:** Scan execution (`HandleScanRequest`) and SERVING health status checking (`HandleHealthRequest`) on port `9090`.

## 4. Exclusions / Prohibitions

- No implementation of `IMP-017-B` (Content Detectors), `IMP-017-C` (Verification Agents), or `IMP-017-D` (Pipeline Agents);
- No implementation of `IMP-018` through `IMP-021` or Phase 3 (`IMP-022+`);
- No modifications permitted to Phase 1 services (`IMP-001` to `IMP-016`), API contracts, or existing database tables (`DB-001` to `DB-031`).

## 5. Dependencies

- **Upstream Dependencies:** Requires completion and certification of `IMP-001` through `IMP-016` (certified complete under immutable tag `phase-1.0.0`).
- **Runtime Dependencies:** Phase 1 `services/runtime` (`AIGatewayService` on port `9090`), Phase 1 `services/foundation` (RLS tenant authentication), Kafka event brokers, Redis/Upstash rate limit store.

## 6. Batch Structure (`A1` through `A9`)

- **Batch A1:** Module Scaffold (`go.mod`, `go.work`, directory structure, `cmd/server/main.go`)
- **Batch A2:** Domain Layer (`Agent`, `MonitorAgent`, platform sources, errors, `EVT-019`/`039` events, repository interfaces)
- **Batch A3:** Application Layer (`MonitorOrchestrator`, DTOs, `AIGatewayClient`, concrete monitor constructors)
- **Batch A4:** Infrastructure Layer (`PlatformAPIClient`, `TokenManager`, `PlatformRateLimiter`, `KafkaEventBus` with DLQ)
- **Batch A5:** Interfaces Layer (`AgentGRPCServer`, SERVING health checks on port `9090`)
- **Batch A6:** Database Migrations (`20260808300000_agents_schema.up.sql` and `down.sql` with RLS)
- **Batch A7:** Tests (Unit, application, and gRPC integration test suites)
- **Batch A8:** Docker & Configuration (`Dockerfile` Volume 31 template, `.env.example`, `docker-compose.yml`)
- **Batch A9:** Final Verification (All 20 requirements verified, Section 25A GREEN tier maintained)

## 7. Quality Gates & Section 25A Workspace Governance

- **Section 25A Storage Target:** Workspace size must remain in the **GREEN Tier (< 25 MB)**.
- **Verification Matrix:** All 20 discrete requirements (`REQ-017A-001` through `REQ-017A-020`) must be satisfied and verified before batch closure.
