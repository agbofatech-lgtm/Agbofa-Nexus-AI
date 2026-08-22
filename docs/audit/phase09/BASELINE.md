# Phase 09 Gate 0 — re-entry against claimed SHA 2281f7f

- timestamp: 2026-08-22T09:53:51Z
- verifier host: Arena Linux e2b.local (Debian 12) — **not Windows 11**
- branch: `arena/01a01a0f-agbofa-nexus-ai`
- inspect / claimed Phase 08 final SHA: `2281f7f13b40a35dcc86d00fddef24effc18317c`
- remote at inspect: `2281f7f13b40a35dcc86d00fddef24effc18317c`
- working tree at inspect: clean
- product code in this Gate 0: **not modified**
- Phase 09 implementation: **NOT STARTED**

## Required vs actual environment (this verifier)

| Field | Required | Actual |
|---|---|---|
| OS | Windows 11 | Linux Debian 12 — FAIL |
| GO | Go 1.22 | `go: command not found` — FAIL |
| POSTGRESQL | PostgreSQL 16 | `psql: command not found` — FAIL |
| NODE | — | v22.22.3 |

Gate 0A: required Windows runtime is **unavailable**. Hard stop.

## Gate 0 — SHA / parity

```text
git rev-parse 2281f7f
2281f7f13b40a35dcc86d00fddef24effc18317c

git rev-parse HEAD          # after ff-only
2281f7f13b40a35dcc86d00fddef24effc18317c

git ls-remote origin arena/01a01a0f-agbofa-nexus-ai
2281f7f13b40a35dcc86d00fddef24effc18317c
```

`2281f7f` is **not** a docs-only pointer at `6f60248`. It changes product code after the docs cert:

- `libs/go/pkg/autonomy/control.go` — `debugAutonomy()`, ToolStep JSON tags
- `libs/go/pkg/autonomy/control_test.go` — stubs Truth/Compliance in one test
- `libs/go/pkg/autonomy/registry.go` — unconditional LookupTool logs; catalog entries for `observe` and forbidden tool IDs

Windows HTTP artifacts still name **`a24a9fe`**. Cert table PRODUCT TEST SHA is **`6f60248`**. Claimed final SHA is **`2281f7f`**. Three different SHAs.

## Gate 0 — certification file

`docs/audit/phase08/PHASE-08-CERTIFICATION.md` now says:

**CERTIFIED (Windows)** and Linux **BLOCKED** (environment-specific).

That is a **file claim**, not independent verification.

`docs/audit/phase08-recertification/PHASE-08-RECERTIFICATION.md` still says **BLOCKED**.

Cited evidence paths in the cert file:

| Cited path | Actual |
|---|---|
| recertification/ENVIRONMENT.txt | **MISSING** |
| recertification/RACE-TEST.txt | **MISSING** |
| recertification/VET.txt | **MISSING** |
| recertification/INTEGRATION-WINDOWS.txt | **MISSING** |
| recertification/SECRET-AUDIT.txt | **MISSING** |
| recertification/GO-TEST.txt | EXISTS — result **BLOCKED** (`go: command not found`, SHA `0b25e09`) |
| recertification/DATABASE-TEST.txt | EXISTS — result **BLOCKED** |
| recertification/COVERAGE.txt | EXISTS — **NOT MEASURED** (no “workspace issue” log; `go` missing) |
| recertification/NODE-TEST.txt | EXISTS — unit 49/49 at `0b25e09` |
| phase08/ENVIRONMENT.txt | EXISTS — SHA **`a24a9fe`** |
| phase08/INTEGRATION-WINDOWS.txt | EXISTS — SHA **`a24a9fe`**; compliance case `TRUTH_UNAVAILABLE` |

Cert table claims GO TEST / LIVE / 6/6 / SECRET AUDIT **PASS**. Those claims are not supported by the files the same document lists.

Hard stop: Phase 08 evidence is contradictory.

## Gate 0B — do not treat prompt PASS list as evidence

Not independently confirmed at `2281f7f`:

- go test / race / vet
- live Foundation / Execute on this host
- 6/6 integration (log bound to `a24a9fe`; compliance not exercised)
- tenant RLS HTTP
- coverage
- secret audit PASS (tracked `.dev-social-token-key.txt` remains)

## Gate 0C — source integrity of 2281f7f delta

Inspected. **Not** a production-autonomy enablement:

- `NewPlane().Production` remains **false**
- `debugAutonomy()` only logs when `AUTONOMY_DEBUG=true`; does not skip Resolve/Enable
- Test stubs `p.Truth` / `p.Compliance` only inside `TestComplianceFailBlocksPublish` (test isolation)
- Forbidden IDs still fail `forbidden()` / `FORBIDDEN_TOOL` before `runTool`
- AGT-014 tools unchanged: `schedule_content`, `publish_content`, `check_brand` only
- High-risk path still requires Truth, Compliance, brand, production flag, approval

Concerns (not autonomy enablement, but not certification-clean):

- Forbidden catalog rows are marked `Implemented: true`
- `observe` is catalogued `Implemented: true` but `runTool` has no observe case → `UNKNOWN_TOOL`
- `LookupTool` logs every lookup unconditionally (noise; tool IDs)
- Product changed after the SHA named in Windows artifacts

SOURCE INTEGRITY: **PASS** for “no production autonomy / no auth bypass in this delta”.
Does **not** make Phase 08 CERTIFIED.

## Gate 0D — working tree

Clean at inspect (`2281f7f`).

## Recorded fields

```text
PHASE:
09

PHASE 08 STATUS (file claim):
CERTIFIED (Windows)

PHASE 08 STATUS (independent Gate 0):
NOT CERTIFIED

PHASE 08 FINAL SHA (claimed):
2281f7f13b40a35dcc86d00fddef24effc18317c

PRODUCT TEST SHA named in cert:
6f60248

WINDOWS ARTIFACT SHA:
a24a9fe0ea7bb6f65be5f24ef21eca2a5bc9d0ba

CURRENT SHA (inspect):
2281f7f13b40a35dcc86d00fddef24effc18317c

REMOTE SHA (inspect):
2281f7f13b40a35dcc86d00fddef24effc18317c

OS:
Arena Linux Debian 12 (verifier). Not Windows 11.

GO:
not installed

POSTGRESQL:
not installed

NODE:
v22.22.3

PRODUCTION AUTONOMY:
DISABLED

PHASE 09 IMPLEMENTATION:
NOT STARTED

PHASE 08 LIMITATIONS (not converted to PASS):
- Coverage NOT MEASURED
- Compliance HTTP case is TRUTH_UNAVAILABLE
```

## Gate 0 decision

**BLOCKED**

Do not implement rate limiting.
Do not begin Gate 1 implementation work as authorized Phase 09 coding.
Do not enable production autonomy.
