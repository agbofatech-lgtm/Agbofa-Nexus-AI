# IMP-017-A IMPLEMENTATION EVIDENCE PACKAGE

**Implementation Unit:** `IMP-017-A` — AI Agent Fleet: Platform Monitors (`AGT-001` through `AGT-008`)  
**Repository Branch:** `arena/019fe056-agbofa-nexus-ai`  
**Date:** 2026-08-08  

---

## 1. Artifact Inventory

The following 24 source files were created under `services/agents/` and the repository root:

```text
docker-compose.yml                                            # Multi-service local composition including agents
services/agents/
├── go.mod                                                    # Module github.com/agbofa/nexus/services/agents
├── Dockerfile                                                # Multi-stage distroless static build (Volume 31)
├── .env.example                                              # Required twelve-factor environment configuration
├── cmd/
│   └── server/
│       └── main.go                                           # Service Entry Point (Volume 22 Section 5.2)
├── internal/
│   ├── domain/
│   │   ├── agent.go                                          # Agent & MonitorAgent interfaces, BaseAgent
│   │   ├── agent_test.go                                     # Unit tests for domain agent rules
│   │   ├── events.go                                         # EVT-019 and EVT-039 event definitions
│   │   ├── platform.go                                       # PlatformSource definitions and domain errors
│   │   └── repository.go                                     # RLS-scoped repository interfaces
│   ├── application/
│   │   ├── aigateway_client.go                               # gRPC wrapper for AIGatewayService (services/runtime)
│   │   ├── dto.go                                            # Scan request/response and health DTOs
│   │   ├── orchestrator.go                                   # MonitorOrchestrator application service
│   │   ├── orchestrator_test.go                              # Application service tests with mocked AI Gateway
│   │   └── ports.go                                          # PlatformClient, EventPublisher, RateLimiter ports
│   ├── monitors/
│   │   ├── agent_monitor.go                                  # Concrete AGT-001 through AGT-008 implementations
│   │   └── agent_monitor_test.go                             # Monitor scan tests & cross-tenant isolation tests
│   ├── infrastructure/
│   │   ├── kafka_publisher.go                                # Kafka EventPublisher emitting EVT-019 & EVT-039
│   │   ├── platform_client.go                                # PlatformAPIClient adapter for 8 social platforms
│   │   └── rate_limiter.go                                   # PlatformRateLimiter token bucket implementation
│   └── interfaces/
│       ├── grpc_server.go                                    # AgentGRPCServer gRPC request handler
│       ├── grpc_server_test.go                               # gRPC handshake and scan integration test
│       └── health.go                                         # SERVING health status checker on port 9090
└── migrations/
    ├── 20260808300000_agents_schema.down.sql                 # Rollback script for agents schema
    └── 20260808300000_agents_schema.up.sql                   # Additive PostgreSQL schema with RLS policies
```

---

## 2. Architecture & Integration Verification

1. **Module Architecture:** Implemented as a single Go workspace module (`github.com/agbofa/nexus/services/agents`), registered in `go.work`.
2. **AI Gateway Integration (`AIGatewayService`):** Every monitor agent scan result is enriched via `GRPCAIGatewayClient`, passing `tenant_id`, `agent_id`, and `execution_context` to `services/runtime`.
3. **Asynchronous Event Bus (`KafkaEventBus`):** Discovered signals and trending topics are published as standard `libs/go/pkg/events.Envelope` instances to:
   - `agbofa.nexus.p2.agents.EVT-019` (`MonitorSignalDetected`)
   - `agbofa.nexus.p2.agents.EVT-039` (`TrendingTopicFound`)
4. **Row-Level Security (RLS) Isolation:** All tables (`agents_state`, `monitor_signals`, `trending_topics`) mandate `tenant_id UUID NOT NULL` and enforce explicit RLS policies (`USING (tenant_id = current_setting('app.current_tenant')::UUID)`). Cross-tenant access attempts return `ErrCrossTenantViolation`.
