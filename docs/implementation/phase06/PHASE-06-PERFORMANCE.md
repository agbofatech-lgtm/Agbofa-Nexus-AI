# Phase 06 — Performance evidence

| Metric | Result | Classification |
|---|---|---|
| Production compile | 37.5s in this environment | INFORMATIONAL |
| `/growth` route JS | 24.9 kB route / 188 kB first load | BUILD OUTPUT |
| Shared first-load JS | 103 kB | BUILD OUTPUT |
| Below-fold activity/loop/health | `next/dynamic` retained | STATIC |
| Cross-domain search | dynamic import on query | STATIC |
| LCP | not measured | NOT MEASURED / BLOCKED |
| CLS | not measured | NOT MEASURED / BLOCKED |
| INP | not measured | NOT MEASURED / BLOCKED |

Build-size inspection is not Core Web Vitals PASS.
