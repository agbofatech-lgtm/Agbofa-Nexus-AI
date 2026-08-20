# PHASE 04 — PUBLISHING PIPELINE IMPLEMENTATION EVIDENCE

```text
PHASE: 04
BASELINE SHA: 0d77364e199ffa9bbb1543f950eb176e66468020
IMPLEMENTATION SHA: 041d58c08751783d51f985de1bddd8652dbfed4b
BRANCH: arena/01a01a0f-agbofa-nexus-ai
```

## PHASE 03 DEPENDENCY

```text
STATUS: BLOCKED
YouTube OAuth: not executed
Real distribution: not executed
```

Phase 04 production certification is therefore **BLOCKED**. Implementation is allowed.

## What was implemented

- Explicit publishing state machine (`libs/go/pkg/publish`)
- Brand + tenant + schedule policy gate (hard fail `BRAND_VALIDATION_FAILED`)
- Durable queue columns + `FOR UPDATE SKIP LOCKED` claim
- Worker: claim → brand/capability → adapter → attempt record → no duplicate if `platform_publication_id` set
- Retry classification + backoff
- Analytics normalization that does **not** invent metrics
- BFF: `/api/v1/publishing/schedule`, `/api/v1/publishing/cancel`
- RPC: `publish.v1.PublishingService/{Schedule,Approve,Cancel,Get,Tick}`

Worker token load returns `REAUTH_REQUIRED` until Phase 03 token exchange is runtime-verified. That is intentional, not a fake publish.

## Tests

```text
unit (source): states, policy, backoff, worker duplicate skip, brand fail, analytics normalize
unit (executed in Arena): NOT EXECUTED — Go unavailable
integration/RLS: NOT EXECUTED — PostgreSQL unavailable
real platform: BLOCKED
```

## CERTIFICATION

```text
PHASE 04 CERTIFICATION: BLOCKED
REAL PLATFORM: BLOCKED
PHASE 05: NOT STARTED
```
