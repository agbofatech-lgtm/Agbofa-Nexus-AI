# Phase 08 Gate 0 — Baseline

- timestamp: 2026-08-21T21:44:11Z
- branch: arena/01a01a0f-agbofa-nexus-ai
- current SHA: 01156dac59c37cc9defa00050fbdbc54b8ec0d1f
- Phase 07 commit 01156da present in ancestry: YES
- working tree: clean after ff-only merge from origin
- Node: v22.22.3
- Go: NOT AVAILABLE in this Arena environment
- production autonomy: DISABLED (NewPlane().Production == false; ControlPlane default false)

## Baseline commands

```text
node --experimental-strip-types --test \
  apps/web/lib/autonomy-control/plane.test.ts \
  apps/web/lib/bff/jwt.test.ts \
  apps/web/lib/bff/csrf.test.ts
```

Result: **28 pass / 0 fail** (19 plane + 6 jwt + 3 csrf). See GATE0-NODE-REGRESSION.txt.

```text
go test ./libs/go/pkg/autonomy/...
go test ./...
```

Result: **BLOCKED** — `go` binary not present. Historical claim of 15 Go tests is not re-runnable here.

## Production autonomy state

Source default `Plane.Production = false`. Not flipped during Gate 0.
