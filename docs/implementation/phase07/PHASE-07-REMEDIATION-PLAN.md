# PHASE 07-B — Remediation authorization matrix

**Gate 0:** HEAD `1321a2f` = audit docs. Forensic product baseline `920f219` is an ancestor. Worktree was clean. Remote matched. Product source after `920f219` is documentation only (`f3e4ad3`, `1321a2f`).

**Gate 1:** VALID. Audit layers still describe `920f219` implementation.

**Environment:** Arena — no Go, no PostgreSQL, no Google OAuth. Cannot convert G-001/G-002/G-009 into PASS.

## Authorization matrix

| ID | Severity | Authorized in 07-B? | Action this session | Verification possible here |
|---|---|---|---|---|
| G-004 | P0 | YES hygiene | `git rm server.exe`; ignore `*.exe` | `git ls-files` |
| G-006 | P1 | YES | BFF RS256 verify (iss/aud/exp/nbf/kid/alg) | `node --test` |
| G-007 | P1 | YES | Origin + CSRF double-submit on mutating BFF | `node --test` + middleware |
| G-008 | P1 | PARTIAL | Stop using XFF as sole identity; keep in-memory store | unit test; **distributed topology remains BLOCKED** |
| G-013 | P1 | YES | security headers (no strict CSP that breaks Next) | `next.config` inspection + build |
| G-001 | P0 | YES intent | **no host credentials** | BLOCKED — EXTERNAL DEPENDENCY |
| G-002 | P0 | YES intent | no fake publish | BLOCKED — EXTERNAL DEPENDENCY |
| G-003 | P0 | Gate 5 only | not until Gate 4 READY | DEFERRED |
| G-005 | P1 | NO (Buf/protoc unavailable) | BLOCKED toolchain | BLOCKED |
| G-009 | P1 | NO Postgres | BLOCKED | BLOCKED |
| G-010–G-012, G-014–G-024 | P1–P3 mixed | NO if P2/P3 cosmetic or autonomy | skip / defer | — |

`server.exe` forensic: SHA-256 `d26bc4eb5035993bc9b5177d790cddb096aeaa099ba7ff037fdfe24289462679`, 15536640 bytes, tracked `100644`, referenced only in audit docs. No `BEGIN PRIVATE KEY` PEM material in the blob (stdlib/env-name strings only). **Not classified as a live credential incident.** Removal authorized.

## Order

1. Authentication / JWT (BFF verify)  
2. CSRF / Origin  
3. Rate-limit identity  
4. Headers  
5. Binary removal  

OAuth, RLS, real distribution, autonomy runtime: **not executed** — Gate 4 will STOP before Gate 5.
