# Batch 1 Architecture Extraction Report

**Scope:** Volumes 1–10  
**Mode:** Extract and register only; no redesign.  

## 1. Extracted Business Domains and Bounded Contexts

Extracted into `docs/indexes/ENTITY_REGISTRY.md`:

- Discovery Context
- Production Context
- Verification Context
- Publishing Context
- Analytics Context
- Provenance Context
- Brand Context
- Autonomous Newsroom
- Frontend Experience Platform
- Enterprise Infrastructure Platform

## 2. Extracted Services / Platform Components

Extracted into `docs/indexes/SERVICE_REGISTRY.md` with source references:

- API Gateway
- Tenant Service
- Brand Service
- Content Service
- Publish Service
- Monetise Service
- Config Service
- Content Query Service
- Analytics Query Service
- Search Service
- Report Service
- Dashboard Service
- Event Bus
- Pipeline Orchestrator
- Content Pipeline Engine
- AI Agent Orchestrator
- Background Job Processor
- Discovery Engine
- Production Engine
- Verification Engine
- Transformation Engine
- Provenance Engine
- Publishing Engine
- Integration Hub
- WebSocket Server
- Workflow Engine

## 3. Extracted Databases and Persistence Components

Extracted into `docs/indexes/DATABASE_REGISTRY.md`:

- PostgreSQL
- Redis
- S3-compatible object storage
- Elasticsearch / PostgreSQL full-text search
- ClickHouse Analytics Store
- Event Store
- Backup Store
- Configuration Store
- Vector Store
- Prompt Repository
- Agent Registry
- DynamoDB Episodic Memory

## 4. Extracted API Categories

Extracted into `docs/indexes/API_REGISTRY.md`:

- REST API
- GraphQL API
- WebSocket API
- Server-Sent Events API
- Registry API
- Health Endpoint
- Authentication API
- Story API
- Agent Management API
- Publishing API
- Admin API
- Public API

## 5. Extracted Event Contracts

Extracted into `docs/indexes/EVENT_REGISTRY.md`:

- TrendDetected
- TopicScored
- ResearchCompleted
- ContentBriefCreated
- DraftGenerated
- ContentEdited
- FactCheckCompleted
- PlagiarismChecked
- QualityScored
- ContentApproved
- HumanReviewRequired
- HumanReviewCompleted
- ContentPublished
- ContentPublishFailed
- ContentEngagement
- PerformanceInsight
- ProvenanceEvent
- ContentScheduled

## 6. Extracted AI Agents

Extracted into `docs/indexes/AGENT_REGISTRY.md`: 28 Batch 1 agents from the Volume 5 agent catalogue.

## 7. Extracted UI Screens

Extracted into `docs/indexes/UI_SCREEN_REGISTRY.md`: 48 screens from the Volume 7 screen inventory.

## 8. Extracted Workflows

Extracted into `docs/indexes/WORKFLOW_REGISTRY.md`: 15 Batch 1 workflows including content pipeline lifecycle, API request lifecycle, AI model invocation, newsroom operations, verification pipeline, content factory, distribution engine, corrections/retractions and enterprise delivery lifecycle.

## 9. Extraction Caveats

- Extraction is for review and traceability only.
- Registry status is pending review approval.
- Later volumes may refine, supersede or clarify Batch 1 extracted boundaries.
- No implementation may rely solely on these extractions without an implementation card and architecture validation gate.
