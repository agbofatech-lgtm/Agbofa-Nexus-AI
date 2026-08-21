# LAYER 7 — Controlled Autonomy Readiness (READ-ONLY)

**Do not implement agents.** This layer classifies architecture only.

## 7.1 Agent architecture

| Component | Classification | Evidence |
|---|---|---|
| Agents (identities) | EXISTS as registry | `docs/indexes/json/agents.json` — 28 items |
| Agent runtime | MISSING | no worker executing agent tools |
| Orchestrator | MISSING | frontend workflow is labeled simulation |
| Workflow engine | SIMULATED | `AgentWorkflowExperience` capability boundary |
| Tool registry | MISSING | LLM Complete is a single chat tool, not a tool bus |
| Agent memory | PARTIAL | `governed_memories` is tenant learning data, not agent working memory |
| Agent state machine | SIMULATED | strategy workforce statuses in fixtures |
| Agent communication | MISSING | |
| Agent scheduling | MISSING | |

## 7.2 Agent permissions

There is **no agent principal**. Autonomy HTTP uses the **human JWT** principal.

Therefore agents cannot currently: access DB, call RPCs, publish, or change RBAC — because they do not run.

Future risk: if an LLM Complete path is given tools without a new authz layer, the **user token** would be the privilege. Least privilege for agents: **MISSING**.

## 7.3 Tool security

| Name | Purpose | Authz | Side effects | Audit |
|---|---|---|---|---|
| `AIGateway/Complete` | LLM text | `content/create` | provider HTTP, estimated cost | usage log |
| Social Connect/Callback | OAuth | `content/create` | Google tokens | oauth_states |
| CreateDistribution / Schedule / Tick | publish pipeline | `content/create` | queue + provider | jobs/audit |
| Autonomy SetLevel / KillSwitch | control | `autonomy/control` OWNER/ADMIN | persist config | autonomy_audit |
| CreateMemory | data | `memory/create` | insert | table |
| ApplyMemoryAsPrivilege | denied | always 403 | none | — |
| SimulateRun | simulation | `autonomy/read` | insert SIMULATION row | `provider_called=false` |

No general tool host. Prompt-injection to tools: N/A beyond Complete.

## 7.4 Policy engine

EXISTS in `libs/go/pkg/autonomy` Evaluate(): levels 0–5, high-risk always await, kill-switch, domain levels.

Enforced on: Schedule (publishing handler), RequestApproval, SimulateRun policy snapshot.

**Not enforced on:** frontend strategy “execute”, newsroom publish buttons (fixtures), LLM Complete (not autonomy-gated).

UI autonomy sliders without BFF: SIMULATED.

## 7.5 Human-in-the-loop

| Action | Source |
|---|---|
| Approval tickets | `approval_tickets` AWAIT / DecideApproval; self-approve HIGH denied |
| Kill switch | persisted ARMED/ENGAGED |
| Cancel distribution/publish | RPCs exist |
| Override | frontend override console is SIMULATED (Phase 4 strategy UI) |
| Emergency OS kill | not this switch (documented as not SIGKILL) |

## 7.6 Autonomous publishing safety

Required chain exists **as code comments + branding + policy + kill-switch + worker**.

Agent cannot bypass today because **no agent publisher**. A future agent that called `Schedule`/`Tick` with an EDITOR JWT **would** still hit kill-switch and brand gate — if it used those RPCs. A future agent that called YouTube with raw tokens would bypass — tokens are server-side only if TokenBox holds.

**Not proven** end-to-end with a live provider.

## 7.7 AI economics

ESTIMATED micros, strategies HIGH_QUALITY/BALANCED/LOW_COST, ledger table.
Missing: invoices, hard tenant spend stop, provider billing, runaway loop quotas beyond BFF in-memory limit.

## 7.8 Failure safety

| Risk | Control |
|---|---|
| Infinite agent loops | MISSING (no runtime) |
| Repeated publish | idempotency keys in jobs (source) |
| Retries | backoff / dead letter (source) |
| Prompt injection | UNKNOWN |
| Runaway cost | ESTIMATED only |
| Unauthorized autonomy | authz + kill-switch |

## Autonomy readiness (evidence, not a fake 0–100 score)

| Category | Status | Evidence | Gap | Blocker |
|---|---|---|---|---|
| Security | PARTIAL | JWT/authz/TokenBox | BFF verify, CSRF, headers, binary in git | P0/P1 |
| Identity | PARTIAL | users/JWT | no agent identity | yes for autonomy |
| Tenant isolation | IMPLEMENTED-NOT-VERIFIED | RLS SQL | runtime proof | yes |
| AI gateway | PARTIAL | OpenAI/Anthropic | no real-provider cert | yes |
| Tool control | MISSING | no tool bus | — | yes |
| Policy enforcement | PARTIAL | autonomy.Evaluate on some RPCs | not universal | yes |
| Human approval | PARTIAL | tickets + kill-switch | override UI simulated | yes |
| Publishing safety | PARTIAL | chain in backend | real provider BLOCKED | yes |
| Observability | PARTIAL | path logs, audit tables | no APM | no |
| Cost controls | PARTIAL | estimated ledger | no hard stop | yes |
| Auditability | PARTIAL | autonomy_audit, distribution_audit | completeness unknown | no |
| Failure recovery | PARTIAL | retry/dead letter source | unproven | yes |

**AUTONOMY READINESS: NOT READY**
