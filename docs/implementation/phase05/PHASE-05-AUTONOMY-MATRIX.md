# PHASE 05 — AUTONOMY MATRIX

```text
SHA (implementation): a53fee766a142f343dd97071ee175d8d7ea4d416
BRANCH: arena/01a01a0f-agbofa-nexus-ai
```

## Levels (persisted integers 0–5)

| Level | Label | May do | Must not do |
|---|---|---|---|
| 0 | OBSERVE | Read posture | Recommend/act/publish/spend |
| 1 | RECOMMEND | Recommendations | Provider calls, publish, spend |
| 2 | PREPARE | Draft artifacts | Dispatch high-risk |
| 3 | APPROVAL-GATED | Queue AWAITING_APPROVAL | Execute before human approval |
| 4 | BOUNDED | In-bounds low-risk | High-risk without approval |
| 5 | AUTONOMOUS | In-bounds low-risk | Self-approve high-risk; ignore kill-switch |

High-risk always (any level): `PAID_GROWTH`, `PUBLISHING` publish, spend, sensitive.

## Domains

STRATEGY, CONTENT, DISTRIBUTION, PUBLISHING, EXPERIMENTS, PAID_GROWTH — independent `autonomy_domains.level`.

## Kill-switch

Persisted `ARMED` \| `ENGAGED`. ENGAGED blocks autonomy dispatch and Phase 04 `Schedule`. Not OS SIGKILL. Audited.

## Runs

`autonomy_runs.execution_reality = SIMULATION`. `provider_called=false`.

## Memory

Persisted insights. `ApplyMemoryAsPrivilege` always DENIED.
