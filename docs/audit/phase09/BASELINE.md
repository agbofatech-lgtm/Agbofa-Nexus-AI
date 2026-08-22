# Phase 09 Gate 0 — prerequisite verification

- timestamp: 2026-08-22T09:26:19Z
- verifier host: Arena Linux e2b.local (Debian 12) — **not Windows 11**
- branch: `arena/01a01a0f-agbofa-nexus-ai`
- claimed certified short SHA: `6f60248`
- claimed certified full SHA: `6f602489dca816e5ab47f23bafee8e41895761ad`
- CURRENT SHA at inspect: `6f602489dca816e5ab47f23bafee8e41895761ad`
- REMOTE SHA at inspect: `6f602489dca816e5ab47f23bafee8e41895761ad`
- working tree: clean after ff-only from grafted `9ee0483`
- product code: not modified in this Gate 0
- Phase 09 implementation: **NOT STARTED**

## Recorded environment (this verifier)

| Field | Required (Windows cert host) | Actual (this Gate 0 host) |
|---|---|---|
| OS | Windows 11 | Linux e2b.local Debian 12 — FAIL |
| GO | Go 1.22 | `go: command not found` — FAIL |
| POSTGRESQL | PostgreSQL 16 | `psql: command not found` — FAIL |
| NODE | — | v22.22.3 |
| npm | — | 10.9.8 |
| git | — | 2.39.5 |

Windows/Go/Postgres values below are **quoted from committed evidence**, not re-measured here.

## Gate 0.1 — claimed SHA

`git rev-parse 6f60248` → `6f602489dca816e5ab47f23bafee8e41895761ad`

Commit subject: `docs(phase08): add Windows runtime evidence; Phase 08 CERTIFIED (Windows)`

That commit changes **only**:

- `docs/audit/phase08/ENVIRONMENT.txt` (UTF-16 LE)
- `docs/audit/phase08/INTEGRATION-WINDOWS.txt` (UTF-16 LE)

No product-code change in `6f60248`.

## Gate 0.2 — authoritative certification file

File: `docs/audit/phase08/PHASE-08-CERTIFICATION.md`

**One authoritative status exists: BLOCKED**

Expected by this Gate 0 prompt: `PHASE 08 = CERTIFIED`

Actual file text: `**Authoritative status (independent recertification, 2026-08-22):** **BLOCKED**`

Also still authoritative: `docs/audit/phase08-recertification/PHASE-08-RECERTIFICATION.md` = **BLOCKED**

Commit message CERTIFIED contradicts the certification file. Hard-stop condition met.

## Gate 0.3 — Windows evidence paths

Requested:

- `docs/audit/phase08-recertification/INTEGRATION-WINDOWS.txt` — **MISSING**
- `docs/audit/phase08-recertification/ENVIRONMENT.txt` — **MISSING**

Present instead:

- `docs/audit/phase08/ENVIRONMENT.txt`
- `docs/audit/phase08/INTEGRATION-WINDOWS.txt`

Decoded ENVIRONMENT.txt (do not treat as this host):

- OS: Windows Microsoft Windows 11 Pro
- Go: go1.22.12 windows/amd64
- PostgreSQL: psql (PostgreSQL) 16.14
- **Repository SHA: `a24a9fe0ea7bb6f65be5f24ef21eca2a5bc9d0ba`**
- Branch: arena/01a01a0f-agbofa-nexus-ai
- Date: 2026-08-22 09:20:10
- Production Autonomy: DISABLED

Decoded INTEGRATION-WINDOWS.txt:

- Timestamp: 2026-08-22 09:20:08
- **Repository SHA: `a24a9fe0ea7bb6f65be5f24ef21eca2a5bc9d0ba`**

Hard-stop: evidence was generated at **another SHA** (`a24a9fe`), not `6f60248`.

`6f60248` is docs-only after `a24a9fe` (no product delta). That does **not** rewrite the SHA bound in the artifacts. Gate 0 requires correspondence to `6f60248`.

### Six integration tests / “all six passed”

The Windows log is a sequence of JSON bodies. There is no command transcript, no HTTP status, no `/healthz`, no auth header capture.

Observed cases:

| Case | Observed | Pass as claimed? |
|---|---|---|
| Enable AGT-003 | `enabled: true`, `production_autonomy: false` | enablement echo only |
| Enable AGT-014 | `enabled: true`, `production_autonomy: false` | enablement echo only |
| Safe analyze_story (AGT-003) | `Status: SUCCEEDED`, `provider_called: false` | controlled observe — not publication |
| Truth failure | `Status: BLOCKED`, `Error: TRUTH_FAILED` | fail-closed Truth demonstrated |
| Compliance failure | `Status: BLOCKED`, `Error: TRUTH_UNAVAILABLE` | **not** `COMPLIANCE_FAILED` |
| Forbidden tool | `Status: FAILED`, `Error: FORBIDDEN_TOOL` | denial demonstrated |
| Kill switch engage | `kill_switch: ENGAGED` | persist claim only |
| Execute after kill | `Status: BLOCKED`, `Error: KILL_SWITCH_ENGAGED` | kill-switch block demonstrated |

Commit message itself: “Compliance test returns TRUTH_UNAVAILABLE (known development-engine limitation)”.

**Cannot confirm “all six passed”.** Compliance was not independently demonstrated.

## Gate 0.4 — live server evidence

Present: JSON Execute-shaped responses and enablement echoes, SHA `a24a9fe`.

Missing:

- Foundation startup log
- PostgreSQL connection proof (beyond `psql --version` text)
- request URL, method, status code
- authentication material class (test bearer vs JWT) — not shown
- tenant isolation / RLS two-tenant HTTP
- audit persistence (`agent_executions` INSERT)
- shutdown

Unit tests are not used as a substitute. Recertification `RUNTIME-TEST.txt` at this tree remains **BLOCKED** (Arena-era).

## Gate 0.5 — coverage limitation

Repo claim at this SHA: **NOT MEASURED / BLOCKED** (`docs/audit/phase08-recertification/COVERAGE.txt`, `docs/audit/phase08/coverage.out`).

No file states “coverage collection failed due to a Go workspace issue.”

Determinations:

1. Phase 08 test plan lists COVERAGE as a certification step; it is not recorded as an allowed PASS exception.
2. Missing coverage is a mandatory unverified gate, not a PASS.
3. Six (or eight) HTTP JSON captures do not replace `go test -coverprofile`.
4. Limitation **must be carried forward**: COVERAGE = NOT MEASURED.
5. Phase 09 must not inherit a fake PASS; if Phase 09 is later authorized it must measure its own coverage.

**NOT MEASURED was not converted to PASS.**

## Gate 0.6 — regression / drift

After ff-only: `HEAD == 6f602489dca816e5ab47f23bafee8e41895761ad`.
No unexpected product-code changes in this Gate 0 session.
`go test ./...` not re-run here (`go` absent).

## Gate 0.7 — remote parity (at inspect)

LOCAL = REMOTE = `6f602489dca816e5ab47f23bafee8e41895761ad`

## Gate 0.8 — security integrity

`NewPlane().Production == false` at this SHA.
`6f60248` did not change auth/JWT/Truth/Compliance/brand/kill-switch source (docs only).
No evidence that a security boundary was bypassed in source to obtain the claim.
Live security matrix (unauth, expired token, RLS) still not independently verified here.

Production autonomy: **DISABLED**

## Gate 0.9 — secret audit

`.dev-social-token-key.txt` remains tracked (`100644` blob `9fa041c…`, 68 bytes, not PEM).
Classification unchanged: historical Phase 03 secret-adjacent artifact.
Contents not printed. No new secrets introduced by this Gate 0.
**SECRET AUDIT = BLOCKED** (real/secret-adjacent material still in tree).

## Evidence references

- `docs/audit/phase08/PHASE-08-CERTIFICATION.md` — authoritative **BLOCKED**
- `docs/audit/phase08-recertification/PHASE-08-RECERTIFICATION.md` — **BLOCKED**
- `docs/audit/phase08/ENVIRONMENT.txt` — Windows env, SHA **a24a9fe**
- `docs/audit/phase08/INTEGRATION-WINDOWS.txt` — HTTP JSON, SHA **a24a9fe**
- `docs/audit/phase08-recertification/COVERAGE.txt` — NOT MEASURED
- `docs/audit/phase08-recertification/GO-TEST.txt` — BLOCKED
- `docs/audit/phase08-recertification/RUNTIME-TEST.txt` — BLOCKED

## Required Gate 0 record fields

```text
PHASE 08 CERTIFIED SHA:
6f602489dca816e5ab47f23bafee8e41895761ad   # claimed by commit message ONLY

EVIDENCE SHA INSIDE WINDOWS ARTIFACTS:
a24a9fe0ea7bb6f65be5f24ef21eca2a5bc9d0ba

CURRENT SHA:
6f602489dca816e5ab47f23bafee8e41895761ad

REMOTE SHA:
6f602489dca816e5ab47f23bafee8e41895761ad

BRANCH:
arena/01a01a0f-agbofa-nexus-ai

OS:
Arena Linux Debian 12 (verifier). Quoted evidence: Windows 11 Pro.

GO:
not installed on verifier. Quoted evidence: go1.22.12 windows/amd64

POSTGRESQL:
not installed on verifier. Quoted evidence: PostgreSQL 16.14

NODE:
v22.22.3

PHASE 08 STATUS:
NOT CERTIFIED

PHASE 09 STATUS:
NOT STARTED

PRODUCTION AUTONOMY:
DISABLED
```

## Gate 0 decision

**BLOCKED**

Phase 09 implementation is not authorized.
Do not implement rate limiting.
Do not enable production autonomy.
Wait for an explicit instruction after Phase 08 is independently CERTIFIED with one non-contradictory status file and SHA-bound evidence that names the certified SHA.
