# LAYER 0 — System & Repository Reality

**Audit SHA (remote HEAD at inspection):** `f3e4ad3774e0f2baa258136a61f324982be801b4`
**Contract-named baseline:** `920f2194390bc701bfb257b72fefc8066dc615f7`
**Ancestry:** `f3e4ad3` = docs-only Windows Phase 06 evidence on top of `920f219`
**Branch:** `arena/01a01a0f-agbofa-nexus-ai`
**Auditor environment:** Arena Debian 12 — no Go, no PostgreSQL, no Docker. Static inspection + existing evidence files. Not a re-run of Windows runtime.

## Repository Structure Map

| Area | Classification | Notes |
|---|---|---|
| `apps/web` | EXISTS | Next.js 15 cinematic frontend + BFF under `app/api/v1` |
| `apps/newsroom`, `apps/reader` | MISSING as apps | Historical `.gitkeep` only; experience lives inside `apps/web` |
| `services/foundation` | EXISTS | Sole Go service with `cmd/server` |
| `services/{analytics,runtime,content-factory,content-origination,distribution,story-graph,truth-engine}` | SCAFFOLDED | `.gitkeep` only — no Go |
| `libs/go/pkg/{config,database,auth,authz,llm,social,publish,autonomy}` | EXISTS | Implementation packages |
| `libs/go/pkg/{cache,observability,storage,featureflags}` | SCAFFOLDED | `.gitkeep` |
| `libs/go/pkg/{events,gateway,validation}` | PARTIAL | Tiny helpers, not a product runtime |
| `libs/python`, `libs/node`, `packages/*` | SCAFFOLDED / ORPHANED | Not consumed by foundation or web BFF path |
| `api/protobuf` | PARTIAL | Few `.proto` files; gen dirs are `.gitkeep` |
| `api/openapi`, `api/json-schema`, `api/asyncapi` | SCAFFOLDED | Almost empty |
| `infrastructure/{docker,helm,k8s,terraform}` | SCAFFOLDED | Templates / empty charts |
| `tests/{chaos,contract,integration,performance}` | SCAFFOLDED | `.gitkeep` |
| `docs/implementation/phase01–06` | EXISTS | Mixed Arena BLOCKED vs later Windows claims |
| `server.exe` | EXISTS / ORPHANED | 15.5 MB Windows binary committed on `40de613` |
| Enterprise docs (`01-Enterprise-Architecture`, registries) | EXISTS as documentation | Not executable systems |

## Git Integrity Report

| Check | Result |
|---|---|
| Remote tip | `f3e4ad3` |
| Phase 06 implementation | `920f219` parent of tip |
| Phase 05 implementation | `a53fee7` then RPC add `40de613` |
| Grafted Arena clones | Often start at `9ee0483` (`agent-recovery-imp-006`); **must fetch** this branch or work is not the production line |
| `.gitignore` | Recorded as **binary** in git (`Bin 316 -> 531`) — INCONSISTENT with a text ignore file |
| History rewrite | Not observed on this branch in the fetched log |

### SHA ancestry (material)

```text
f2a0b41  PROD-00 config tests (Windows-bound evidence)
e12dbd2  historical Phase 01 implementation end (docs)
9c77ff8  Phase 02 adapters
e93f0d2  Phase 02 BFF
0406cf7  Phase 02 test fix
5a0680b / e2f7977  Phase 03 model + RPC
2810ed6  YouTube OAuth + encrypt + adapter
041d58c / cd6683d  Phase 04 publishing
0d77364  Phase 03 BLOCKED evidence
a53fee7 / 40de613  Phase 05
920f219  Phase 06 frontend aggregation
f3e4ad3  Phase 06 Windows cert doc (escaped markdown)
```

## System Relationship Map

```text
Browser
  → apps/web (UI fixtures + optional BFF overlay)
    → /api/v1/* BFF (cookie JWT forward, in-memory rate limit)
      → services/foundation JSON HTTP /rpc/* (not generated protobuf)
        → pgx + InTenantTx + RLS GUC
        → libs/go/pkg/{auth,authz,llm,social,publish,autonomy}
          → OpenAI/Anthropic HTTP (if keys present)
          → YouTube Data API (if OAuth tokens present)
```

Empty service directories are **not** in this path.

## Ownership Map

| Capability owner (code) | Path |
|---|---|
| Identity / JWT / passwords | `libs/go/pkg/auth`, `handlers/identity.go` |
| Authz | `libs/go/pkg/authz` |
| Config/secrets | `libs/go/pkg/config` |
| AI complete | `libs/go/pkg/llm`, `handlers/ai.go` |
| Social OAuth / YouTube | `libs/go/pkg/social`, `handlers/social.go` |
| Publishing worker | `libs/go/pkg/publish`, `handlers/publishing.go` |
| Autonomy/memory/cost | `libs/go/pkg/autonomy`, `handlers/autonomy.go` |
| Frontend OS | `apps/web` |
| Other named services | **no owner code** |

## Historical Phase Verification (see PHASE-VERIFICATION.md)

Declared statuses in Phase 06/07 contracts are **not** automatically verified. Independent verification in this Arena session cannot re-run Go/Postgres/Windows OAuth.
