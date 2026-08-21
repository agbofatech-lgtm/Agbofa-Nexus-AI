# Phase 06 — Frontend runtime evidence

SHA under test: recorded at commit time on `arena/01a01a0f-agbofa-nexus-ai`.
Parent: `40de61332034acc1c0445c91dc11c9ed78d7c1d8`
Environment: Arena sandbox Debian 12, Node v22.22.3, pnpm 11.22.0, Next.js 15.5.23 production `next start` on `0.0.0.0:3000`.

| Test ID | Description | Command / action | Result | Exit | Classification |
|---|---|---|---|---|---|
| PH06-R01 | Repository baseline | `git rev-parse HEAD` before implementation | `40de61332034acc1c0445c91dc11c9ed78d7c1d8` | 0 | PASS |
| PH06-R02 | TypeScript | `pnpm --filter @agbofa/web typecheck` | PASS `tsc --noEmit` | 0 | PASS |
| PH06-R03 | ESLint | `pnpm --filter @agbofa/web lint` | ZERO errors, ZERO warnings after type-import fix | 0 | PASS |
| PH06-R04 | Production build | `pnpm --filter @agbofa/web build` | Compiled; 87/87 static pages generated | 0 | PASS |
| PH06-R05 | Route HTTP | `curl` 20 executive/domain paths on `:3000` | All HTTP 200 | 0 | PASS (HTML 200; AuthGuard is client-side) |
| PH06-R06 | KPI strip | Static + `/growth` HTML contains Command Center | Values remain labeled FIXTURE/UNAVAILABLE/ESTIMATED | — | STATIC PASS |
| PH06-R07 | Opportunities | Adapter top-N from Growth service | 5 fixture opportunities, drill-down `/growth/opportunities` | — | STATIC PASS |
| PH06-R08 | Strategies | Adapter from Strategy Director | Fixture recommendations, not regenerated | — | STATIC PASS |
| PH06-R09 | Workforce | `workforce.total` = registry length, source FIXTURE | Live telemetry UNAVAILABLE; no hard-coded live 28 | — | STATIC PASS |
| PH06-R10 | Experiments | Phase 3 experiment fixtures | SIMULATED / FIXTURE | — | STATIC PASS |
| PH06-R11 | AI cost | Fixture estimate + live overlay stays ESTIMATED | Not invoices | — | STATIC PASS |
| PH06-R12 | Attribution | CONTENT→…→REVENUE stages | Causality NOT_ESTABLISHED; revenue UNAVAILABLE | — | STATIC PASS |
| PH06-R13 | Learning | Fixture until live memory list | Memory privilege DATA_ONLY | — | STATIC PASS |
| PH06-R46 | Browser QA | `next start` Ready; HTTP 200 | No interactive viewport/keyboard matrix | — | BLOCKED / PARTIAL |
| PH06-R47 | Performance | LCP/CLS/INP | Not measured (no Lighthouse) | — | NOT MEASURED / BLOCKED |

Limitations: Authenticated BFF overlay was not exercised against a live Windows foundation process in this sandbox. Unauthenticated Command Center remains fixture-labeled.
