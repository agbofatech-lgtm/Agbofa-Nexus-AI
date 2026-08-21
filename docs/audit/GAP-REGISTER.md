# GAP REGISTER

| ID | Layer | Severity | Capability | Evidence | Current Reality | Expected State | Dependency | Risk | Blocking | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| G-001 | 4/5 | P0 | YouTube OAuth | historical `invalid_oauth`; proto Callback missing | UNVERIFIED / PARTIAL | RUNTIME-VERIFIED exchange + persist | Google console, TokenBox, RLS | token theft / failed connect | YES prod social | Windows rebuild + X-Agbofa-RPC + DB row |
| G-002 | 4/5 | P0 | Real publish | no provider video id | BLOCKED | PUBLISHED with real id | G-001 + worker | fake success | YES | YouTube videos.insert |
| G-003 | 7 | P0 | Agent runtime | 28 registry, no executor | MISSING | isolated runtime + identity | authz, tools | cannot “go autonomous” | YES autonomy | design + tests |
| G-004 | 0 | P0 | `server.exe` in git | 15.5MB blob | EXISTS | not in VCS | release process | malware/supply chain | YES hygiene | git rm + ignore |
| G-005 | 1 | P1 | Contract drift | JSON RPC ≠ proto; gen empty | INCONSISTENT | generated+registered | buf | silent breaks | YES API | buf generate + CI |
| G-006 | 2 | P1 | BFF JWT verify | session decodes only | PARTIAL | verify or opaque session | auth | spoofed session JSON | YES | tests |
| G-007 | 2 | P1 | CSRF | unused in Next | ORPHANED | double-submit on mutations | cookies | CSRF on cookie session | YES | tests |
| G-008 | 2 | P1 | Rate limit | memory Map + XFF | PARTIAL | shared limiter | deploy | brute force | YES auth | load test |
| G-009 | 3 | P1 | RLS proof | SQL only | IMPLEMENTED-NOT-VERIFIED | two-tenant HTTP proof | Postgres | cross-tenant | YES | integration tests |
| G-010 | 3 | P1 | role_policies unused | Decide() in-memory | INCONSISTENT | single policy source | authz | drift | no | code+tests |
| G-011 | 5 | P1 | Empty microservices | .gitkeep | SCAFFOLDED | implement or delete from architecture | docs | false completeness | no | inventory |
| G-012 | 5 | P1 | Strategy/newsroom/truth | fixtures | SIMULATED | backend or labeled forever | — | false OS | no | product decision |
| G-013 | 6 | P1 | Security headers | none | MISSING | CSP/HSTS | web | XSS/clickjack | no | header scan |
| G-014 | 7 | P1 | Tool bus / least privilege | Complete only | MISSING | allowlisted tools | G-003 | over-privilege | YES autonomy | design |
| G-015 | 7 | P1 | Cost hard-stop | ESTIMATED | PARTIAL | quota deny | gateway | runaway $ | YES autonomy | tests |
| G-016 | 5 | P2 | Memory JSON tags | PascalCase Insight | INCONSISTENT | snake_case like other RPCs | handlers | false BLOCKED | no | contract tests |
| G-017 | 0 | P2 | Binary gitignore | git shows Bin | INCONSISTENT | text .gitignore | git | ignore failures | no | rewrite file |
| G-018 | 4 | P2 | Non-YouTube social | catalog only | SCAFFOLDED | adapters or remove claims | OAuth | fake platforms | no | catalog vs router |
| G-019 | 6 | P2 | Refresh rotation BFF | cookie only | PARTIAL | rotate/revoke | auth | stolen refresh | no | tests |
| G-020 | 6 | P3 | SBOM/DR/TLS | docs/templates | MISSING | real pipeline | infra | ops | no | deploy |
| G-021 | 0 | P2 | Certification docs conflict | Arena CONDITIONAL vs Windows CERTIFIED vs P03-04 dual narrative | INCONSISTENT | one register | process | false cert | YES governance | owner reconcile |
| G-022 | 5 | P2 | Analytics/monetization | UI only | UNAVAILABLE | real or remove | billing | fake revenue | no | product |
| G-023 | 7 | P2 | Prompt injection | none | UNKNOWN | input/output policy | Complete | unsafe content | yes if tools | eval |
| G-024 | 1 | P3 | Pagination | LIMIT N | PARTIAL | cursors | lists | incomplete | no | API |
