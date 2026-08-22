# Phase 09 Gate 0 / 0A — READ-ONLY baseline

- timestamp: 2026-08-22T08:36:00Z
- host: Arena Linux e2b.local (not Windows)
- branch: arena/01a01a0f-agbofa-nexus-ai
- inspect SHA: `049049a80cb25341dd72391d08cc2d264c62fbb5`
- Phase 07 ancestor `01156da`: YES
- working tree: clean after ff-only
- Go: NOT AVAILABLE
- Node: v22.22.3
- psql: NOT AVAILABLE
- production autonomy in source: `NewPlane().Production == false`

## Phase 08 independent certification check

Commands:

```text
git rev-parse HEAD
git log --oneline -5
# read docs/audit/phase08/PHASE-08-CERTIFICATION.md
# read docs/audit/phase08/FINAL-TEST-REPORT.md
# read docs/audit/phase08/integration-test.txt
```

### What the repository actually contains

1. Formal section 20 of `PHASE-08-CERTIFICATION.md` still states **PARTIAL**.
2. Commit `049049a` (`docs(phase08): finalise certification; Phase 08 CERTIFIED`) **appends** a second document claiming CERTIFIED to the same file. It is **docs-only** (41 lines, no test artifacts).
3. That append cites SHA `6947a8a (plus local test fix)` — not HEAD `049049a`.
4. `FINAL-TEST-REPORT.md` (SHA 63fa309 era): Go BLOCKED, live HTTP BLOCKED, coverage BLOCKED.
5. `integration-test.txt`: `result: BLOCKED` / `go: NOT AVAILABLE`.
6. `coverage.out`: not a Go cover profile; text note BLOCKED.
7. HTTP table in the appended CERTIFIED block has no request/response captures, no command, no host, no SHA-bound log.
8. This Arena session cannot independently re-run `go test` or live Foundation HTTP.

### Independent verdict

**PHASE 08: NOT CERTIFIED** for Phase 09 purposes.

A commit message and an appended CERTIFIED heading do not override:

- the still-present **PARTIAL** status in the same file
- BLOCKED integration/coverage evidence
- missing independently reproducible Go/runtime artifacts at this SHA

Phase 09 contract:

> If Phase 08 cannot be independently verified as CERTIFIED: STOP.  
> PHASE 09 BLOCKED — PHASE 08 NOT CERTIFIED  
> Do not modify source.

## Gate 1 — forensic rate-limit audit (read-only)

| Component | Classification | Evidence |
|---|---|---|
| BFF `apps/web/lib/bff/limits-core.ts` | EXISTS, process-local | in-memory window; identity not XFF (`csrf.test.ts`) |
| BFF `rateLimitRequest` | PARTIAL | cookie JWT `sub` + UA; no shared store |
| TS plane tool limiter | EXISTS, process-local | `plane.ts` RATE_LIMIT / THROTTLED |
| Go plane | PARTIAL | `ratePerMin` field exists; no HTTP 429 middleware on foundation |
| Phase 04 worker 429 | EXISTS | classify/backoff only (provider 429), not inbound API limiter |
| LLM gateway 429 | EXISTS | retry on `ErrProviderRateLimited` |
| Distributed limiter | MISSING | documented BLOCKED in BFF comments |

MUST NOT CHANGE without Phase 08 CERTIFIED: auth, JWT RS256, policy, Truth, Compliance, brand, kill switch, Phase 03/04, production autonomy default.

## Production autonomy

DISABLED. Not flipped. Phase 09 not started.

## Decision

**STOP.** No source, test, config, migration, or infrastructure changes.

Required next action (outside this Arena session): produce SHA-bound Phase 08 evidence that actually satisfies CERTIFIED (Go regression, live authenticated Execute, coverage), then re-run Gate 0.
