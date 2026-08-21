# PHASE 07 AUTONOMY TEST REPORT

Classification key: PASS | FAIL | BLOCKED | NOT APPLICABLE

| Gate | Test | Class | Evidence |
|---|---|---|---|
| 5.1 Registry lookup / unique IDs | PASS | Node unit |
| 5.1 Invalid / disabled / unauthorized | PASS | Node unit |
| 5.2 Success / fail / timeout / cancel / dup / concurrent / runaway | PASS | Node unit (timeout covered by clock injection) |
| 5.3 Tool allow/deny | PASS | Node unit |
| 5.4 Permissions | PASS | Node unit |
| 5.5 Policy | PASS | Node unit |
| 5.6 Approval | PASS | Node unit |
| 5.7 Execution state / tenant isolation | PASS | Node unit (in-memory store) |
| 5.7 Restart recovery (process crash + DB) | BLOCKED | no Postgres / no durable load path wired to HTTP yet |
| 5.8 Memory | PASS | Node unit |
| 5.9 Budget | PASS | Node unit (token accounting ESTIMATED; not invoices) |
| 5.10 Rate limit | PASS | Node unit (process-local; not distributed) |
| 5.11 Kill switch | PASS | Node unit + existing Phase 05 persist path (Schedule still uses Store kill) |
| 5.12 Workflow engine | PASS | Node unit `runWorkflow` |
| 5.13 Phase 04 port invocation | PASS | Node unit recording adapter; **not** live Schedule RPC |
| 5.13 Phase 03 provider | BLOCKED | EXTERNAL PROVIDER DEPENDENCY |
| 5.14 Idempotency of executions | PASS | Node unit |
| 5.14 Provider 401/429/5xx through worker | BLOCKED | no live worker tick from agent path in Arena |
| 5.15 Adversarial | PASS | Node unit |
| 5.16 Audit | PASS | Node unit |
| 5.17 Concurrency | PASS | Node unit |
| 5.18 Full chain with real YouTube | BLOCKED | EXTERNAL PROVIDER DEPENDENCY |
| 5.18 Full chain with Phase 04 fake + production flag test plane | PASS | Node unit; `provider_called: false` |
| go test / go build | BLOCKED | Arena has no Go |
| Foundation Execute RPC live | BLOCKED | no `go run`, no Postgres |
| Production autonomous publishing | NOT APPLICABLE | disabled by default; not enabled |

Do not read SUCCEEDED observe executions as YouTube publication.
Do not read `ticked: true` as publish PASS.
