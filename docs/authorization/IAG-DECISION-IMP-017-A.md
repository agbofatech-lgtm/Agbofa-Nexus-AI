# IAG Decision Record — IMP-017-A

| Field | Value |
|---|---|
| Decision ID | IAG-DECISION-IMP-017-A |
| Decision Date | 2026-08-08 |
| Implementation Unit | IMP-017-A — AI Agent Fleet: Platform Monitors (AGT-001 through AGT-008) |
| Evaluation Result | Approved |
| Effective Authorization | Granted |
| Authorized By | Agbofa Benjamin |
| Authorization Date | 2026-08-08 (Retroactive Authorization Record) |
| Production Code Generation | Permitted within approved IMP-017-A scope only |

## Decision

```text
IAG Decision: APPROVED
Formal Authorization: GRANTED
Implementation Authorized: YES
Production Code Generation: PERMITTED WITHIN APPROVED IMP-017-A SCOPE ONLY
```

## Authorized Scope

`IMP-017-A` authorization is strictly limited to the first squad of the Phase 2 AI Agent Fleet — Platform Monitors:

- 8 Platform Monitor agents (`AGT-001` Twitter/X, `AGT-002` Facebook, `AGT-003` Instagram, `AGT-004` TikTok, `AGT-005` LinkedIn, `AGT-006` YouTube, `AGT-007` Reddit, `AGT-008` Emerging Platforms/RSS) implemented inside the single workspace module `github.com/agbofa/nexus/services/agents`;
- Live HTTP/REST/OAuth2 platform API client adapters (`PlatformAPIClient`) with full JSON response parsing for all target social media platforms;
- Automated OAuth2 token rotation manager (`TokenManager`) with Redis/in-memory TTL caching;
- Distributed Redis Lua atomic token-bucket rate limiting (`PlatformRateLimiter`);
- Adversarial flood protection (`FloodDetector`) and exponential backoff retry differentiation (`domain.RetryWithBackoff`);
- gRPC LLM routing through Phase 1 `AIGatewayService` (`services/runtime`) with 30s deadlines;
- Kafka event bus emission for `EVT-019` (`MonitorSignalDetectedEvent`) and `EVT-039` (`TrendingTopicFoundEvent`) via Sarama `SyncProducer` with dead-letter queueing (`DLQStats`);
- Additive PostgreSQL schema migration (`20260808300000_agents_schema`) for `agents_state`, `monitor_signals`, and `trending_topics` with Row-Level Security (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`);
- gRPC server endpoints (`HandleScanRequest`, `HandleHealthRequest` SERVING on port `9090`).

## Exclusions

- No implementation of `IMP-017-B` (Content Detectors), `IMP-017-C` (Verification Agents), or `IMP-017-D` (Pipeline Agents);
- No implementation of `IMP-018` through `IMP-021` or Phase 3 (`IMP-022+`);
- Zero modifications permitted to Phase 1 services (`IMP-001` through `IMP-016`), API contracts, or database tables (`DB-001` through `DB-031`).

## Evidence References

- Implementation evidence: `docs/implementation/imp-017/IMP-017-A/IMPLEMENTATION_EVIDENCE.md`
- Batch closure record: `docs/implementation/imp-017/IMP-017-A/BATCH_CLOSURE_RECORD.md`
- Validation report: `docs/implementation/imp-017/IMP-017-A/IMPLEMENTATION_VALIDATION.md`
- Authoritative specification retrieval & gap analysis report
- Requirement checklist: `REQ-017A-001` through `REQ-017A-020`
