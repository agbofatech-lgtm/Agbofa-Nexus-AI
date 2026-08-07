# Batch 1 Terminology Audit Report

**Scope:** Volumes 1–10  
**Instruction:** Do not normalize yet; report inconsistencies only.

| Preferred / Candidate Term | Alternative Terms Observed | First Occurrence / Source | Inconsistency Type | Recommendation |
|---|---|---|---|---|
| Truth Engine | Verification Engine; Verification Context; Verification Pipeline (Truth Engine) | Volume 3 service/component references; Volume 6 Part VI | Naming boundary ambiguity | Preserve all terms until Volumes 13 and 25 are reviewed; create canonical mapping later. |
| Content Factory | Production Engine; Production Context; Content Factory Workflow | Volume 3 and Volume 6 | Service/domain boundary ambiguity | Do not merge terms; map to bounded contexts after Batch 2/3 review. |
| Distribution Engine | Publishing Engine; Publish Service; Publishing Context; Platform Adaptation | Volume 3 and Volume 6 | Domain/service naming overlap | Create canonical distribution/publishing taxonomy after Volumes 17–18/28 are reviewed. |
| AI Agent Orchestrator | Orchestrator Agent; Workflow Engine; Agent Registry; Execution Manager | Volume 3 and Volume 5 | Component vs agent ambiguity | Preserve distinctions; require implementation cards to cite exact source. |
| Story Graph | Story Intelligence; Story Lifecycle; Story-Centric Memory | Volumes 6 and 7; Volume 5 ADRs | Conceptual overlap | Await Volume 27 before canonical mapping. |
| API Gateway | Custom lightweight gateway; Kong/APISIX; Managed API Gateway | Volumes 3 and 9 | Phase evolution / product choice | Treat as phase-based evolution unless contradicted by later volumes. |
| Primary Language | TypeScript/Node.js; Go reserved; Python for offline/model-training | Volume 3 | Potential conflict with pre-intake governance assumptions | Source documentation must win; reconcile with Phase 5 before implementation. |
| Message Broker | In-memory events; Redis Pub/Sub; RabbitMQ/Kafka; SQS/EventBridge | Volumes 3 and 10 | Phase evolution / technology variance | Resolve via ADR reconciliation and phase mapping. |
| Primary Database | PostgreSQL; Aurora PostgreSQL | Volumes 3, 9, 10 | Productized cloud implementation variance | Treat Aurora as AWS implementation of PostgreSQL unless later documents say otherwise. |
| Real-Time Updates | WebSocket; SSE; EventSource | Volume 8 | Interface distinction | Preserve: WebSocket for bidirectional real-time; SSE for AI streaming per ADR-FE-005. |

## Glossary Seed

- **Autonomous Newsroom:** AI-driven newsroom workflow spanning discovery, verification, production, publishing, monitoring and corrections.
- **Bounded Context:** Domain boundary with owned data and APIs/events.
- **Content Pipeline:** Discover → Research → Generate → Verify → Adapt → Publish lifecycle.
- **Human Review Required:** Event/workflow gate when confidence, safety or governance thresholds require human approval.
- **ProvenanceEvent:** Immutable lineage event emitted across content pipeline stages.

## Recommendation

Do not normalize terminology yet. Wait until Batch 2 and Batch 3 implementation specification volumes are reviewed, then produce a canonical terminology map with approved aliases.
