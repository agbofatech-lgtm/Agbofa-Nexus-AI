# Phase 08 Windows operator guide

How certification must be produced so an independent Gate 0 can PASS.

- written: 2026-08-22T11:31:40Z
- branch: `arena/01a01a0f-agbofa-nexus-ai`
- product freeze target (do not treat as already certified): `2281f7f13b40a35dcc86d00fddef24effc18317c`
- this guide does **not** certify Phase 08
- Phase 09 remains unauthorized until Gate 0 independently PASSES

---

## 1. What “done” means (exact)

Independent verification will accept **only**:

| Status | Meaning |
|---|---|
| CERTIFIED | Every mandatory gate below has a SHA-bound log that matches the claim |
| PARTIAL | Implementation exists; some mandatory live/runtime evidence is missing |
| BLOCKED | Required environment or evidence cannot be produced |
| FAILED | A command or live case produced the wrong result |

Never use: “mostly certified”, “certified with caveats”, “PASS except…”.

A commit message is not certification.  
A heading in `PHASE-08-CERTIFICATION.md` is not certification.  
Empty files are not SKIPPED and not PASS.  
Unit tests are not live Execute.  
`ticked: true` is not YouTube publish.  
`TRUTH_UNAVAILABLE` is not Compliance PASS and not Compliance FAIL.

Phase 09 starts **only after** an independent agent re-reads the files and reports Gate 0 = PASS.

---

## 2. What failed last time (do not repeat)

1. Binding evidence to the wrong SHA (`a24a9fe`, then `3b0435b` which is a Gate 0 **BLOCKED** note).
2. Claiming `go test ./...` PASS while the log ended **FAIL**, then replacing the log with autonomy-only `(cached)` PASS, then **zeroing** `GO-TEST.txt`.
3. Claiming RACE SKIPPED / VET PASS with **0-byte** files.
4. Running the six HTTP cases **after** kill-switch ENGAGED, so every execute was `KILL_SWITCH_ENGAGED`.
5. Using an email body for “compliance” → Truth returns `TRUTH_UNAVAILABLE` first (see §8).
6. Writing PowerShell `Out-File` UTF-16 and calling it recertification evidence.
7. Leaving `PHASE-08-RECERTIFICATION.md` and the cert table on different statuses/SHAs.
8. Asking Arena Linux to certify Windows.

---

## 3. Environment (mandatory)

Host: **Windows 11** (not Arena Linux).

| Tool | Command | Required |
|---|---|---|
| OS | `ver` | Windows 11 |
| Go | `go version` | Go 1.22.x windows/amd64 |
| PostgreSQL | `psql --version` | 16.x |
| Node | `node --version` | v20+ (repo has been using v22) |
| npm | `npm --version` | recorded |
| git | `git --version` | recorded |

Use **cmd.exe** or quote every URL in PowerShell.  
Use **`curl.exe`**, never PowerShell `curl` (that is `Invoke-WebRequest`).  
Do not split URLs on `&`.

---

## 4. SHA freeze (do this first)

```bat
git checkout arena/01a01a0f-agbofa-nexus-ai
git status --short
git rev-parse HEAD
git rev-parse 2281f7f13b40a35dcc86d00fddef24effc18317c
```

Rules:

- Product code under test must be **exactly** one SHA. Call it `PRODUCT_SHA`.
- If you need the `2281f7f` product tree, check it out (or a later SHA only if you **re-run every test** on that later SHA).
- After tests start, **do not change** `libs/`, `services/`, `apps/web/lib/` until all logs are captured.
- Evidence commit SHA ≠ product SHA. Record both.
- Never write `PRODUCT TEST SHA: <a Gate 0 docs commit>`.

Record in every evidence file:

```
timestamp: <ISO-8601>
product_sha: <full>
docs_sha: <filled after evidence commit>
branch: arena/01a01a0f-agbofa-nexus-ai
environment: Windows 11, go <ver>, psql <ver>
command: <exact>
expected: <exact>
actual: <paste command output>
result: PASS | FAIL | SKIPPED | BLOCKED | NOT MEASURED
```

Write files as **UTF-8** (no UTF-16). In PowerShell:

```powershell
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()
```

Or append with `cmd /c "command >> file.txt"`.

---

## 5. Secrets and Foundation env (do not paste values into chat)

Required (RS256 only — **not HS256**):

| Purpose | Env var |
|---|---|
| App env | `AGBOFA_ENV=development` |
| Database | `AGBOFA_SECRET_DATABASE_URL` → `postgres://…@localhost:5432/nexus?sslmode=disable` |
| Test database | `AGBOFA_TEST_DATABASE_URL` → `…/nexus_test?sslmode=disable` |
| JWT | `AGBOFA_JWT_ISSUER`, `AGBOFA_JWT_AUDIENCE`, `AGBOFA_JWT_ACTIVE_KID=k1` |
| JWT PEMs | `AGBOFA_SECRET_JWT_KEYS_K1_PRIVATE_PEM`, `AGBOFA_SECRET_JWT_KEYS_K1_PUBLIC_PEM` (real PEM text) |
| Social wrap key | `AGBOFA_SECRET_SOCIAL_TOKEN_KEY` (32 bytes) |
| Cookie | `AGBOFA_COOKIE_SECURE=false` on http://localhost |
| Test auth | `PLANE_TEST_AUTH=true` only with `AGBOFA_ENV=development` or `test` |
| Optional debug | `AUTONOMY_DEBUG=true` |

Do **not** set `AGBOFA_JWT_ALGORITHM=HS256`.  
Do **not** set `PLANE_PRODUCTION` (it is not a real config var). `NewPlane().Production` is hardcoded **false**.  
Load PEMs with `Get-Content -Raw`.  
Never commit PEMs, `.env`, or `.dev-social-token-key.txt`.

Login JSON field is **`credential`**, not `password`.

---

## 6. Database

```bat
psql --version
psql -d postgres -c "\l"
```

Must exist: `nexus` (runtime), `nexus_test` (Go integration tests).

Apply repo migrations only (do not invent a second schema).  
Do not print passwords.

Write `docs/audit/phase08-recertification/DATABASE-TEST.txt` with `\l` plus a table list for `nexus` (no secrets).

If `AGBOFA_TEST_DATABASE_URL` is unset, `go test ./...` **FAIL**s in `services/foundation/internal/repositories`. That FAIL must stay in the log until the URL is set and the tests are re-run green.

---

## 7. Go / race / vet / coverage

From the repo root (or each module if `go.work` requires it). Capture **full stdout+stderr**. Do not edit the log.

```bat
go test ./... > docs\audit\phase08-recertification\GO-TEST.txt 2>&1
echo EXIT:%ERRORLEVEL% >> docs\audit\phase08-recertification\GO-TEST.txt

go test -race ./... > docs\audit\phase08-recertification\RACE-TEST.txt 2>&1
echo EXIT:%ERRORLEVEL% >> docs\audit\phase08-recertification\RACE-TEST.txt

go vet ./... > docs\audit\phase08-recertification\VET.txt 2>&1
echo EXIT:%ERRORLEVEL% >> docs\audit\phase08-recertification\VET.txt

go test -coverprofile=docs\audit\phase08-recertification\coverage.out ./libs/go/pkg/autonomy
go tool cover -func=docs\audit\phase08-recertification\coverage.out > docs\audit\phase08-recertification\COVERAGE.txt
```

Acceptance:

| File | PASS if | SKIPPED if | FAIL if |
|---|---|---|---|
| GO-TEST.txt | last line is all packages `ok`, **no** `FAIL`, EXIT=0 | never | any `--- FAIL` or EXIT≠0 |
| RACE-TEST.txt | EXIT=0, tests ran | file contains the **actual** `CGO_ENABLED=0` / gcc error **and** you label SKIPPED not PASS | tests ran and failed |
| VET.txt | EXIT=0 (empty output is OK **only if** the file also contains the command + `EXIT:0`) | — | vet reports issues |
| COVERAGE.txt | `go tool cover` printed a real percent | measurement impossible → **NOT MEASURED** + exact error | fabricated percent |

Do **not** convert SKIPPED or NOT MEASURED into PASS.

---

## 8. Node (canonical suite — no glob)

```bat
node --experimental-strip-types --test apps/web/lib/autonomy-control/plane.test.ts apps/web/lib/autonomy-control/truth.test.ts apps/web/lib/autonomy-control/compliance.test.ts apps/web/lib/autonomy-control/policy-integration.test.ts apps/web/lib/autonomy-control/testauth.test.ts apps/web/lib/bff/jwt.test.ts apps/web/lib/bff/csrf.test.ts > docs\audit\phase08-recertification\NODE-TEST.txt 2>&1
```

Required: `# pass 49` `# fail 0` (or better).  
This is **UNIT**, not live certification.

---

## 9. Truth / Compliance semantics (exact)

Development Truth (`DevelopmentTruth.Verify`):

| Input | Result | Code |
|---|---|---|
| exact `DEV_TRUTH_FIXTURE: local observation` | `true, nil` | pass |
| contains `the earth is flat` / `2+2=5` / `known-false:` | `false, nil` | `TRUTH_FAILED` |
| empty / anything else | `false, ErrTruthUnavailable` | `TRUTH_UNAVAILABLE` |

Development Compliance (`DevelopmentCompliance.Check`):

| Input | Result | Code |
|---|---|---|
| non-empty, no prohibited/PII | `true, nil` | pass |
| `prohibited:unlicensed-medical-claim` or `bypass compliance` | `false, nil` | `COMPLIANCE_FAILED` |
| email or `\d{3}-\d{2}-\d{4}` | `false, nil` | `COMPLIANCE_FAILED` |
| empty | `false, err` | `COMPLIANCE_UNAVAILABLE` |

High-risk tools evaluate **engines on `body`/`text`**, not client `truth_passed` flags.

**Live HTTP limitation (do not lie about it):**  
Truth only accepts the **exact** fixture string. That fixture is also compliant. Therefore a live request **cannot** reach `COMPLIANCE_FAILED` without changing product code (do not change it for a badge).  

Record:

- Unit: `TestComplianceFailBlocksPublish` (stubs Truth) → `COMPLIANCE_FAILED` = unit PASS
- Live: Compliance isolated path = **NOT DEMONSTRATED**
- Live body with email = `TRUTH_UNAVAILABLE` = **not** Compliance PASS/FAIL

---

## 10. Start Foundation (live)

From `services/foundation` after env is set (env is **not** auto-loaded):

```bat
go run ./cmd/server
```

Bind `:8080`. Do not mock.

```bat
curl.exe -sS -D - http://127.0.0.1:8080/healthz -o healthz.body.txt
curl.exe -sS -D - http://127.0.0.1:8080/readyz -o readyz.body.txt
```

`/readyz` must be 200 only if Postgres pings.  
Save headers (`X-Agbofa-Build`) + status into `RUNTIME-TEST.txt`.

---

## 11. Live Execute matrix (this is the 6-case test)

**Preconditions (or every case will be `KILL_SWITCH_ENGAGED`):**

1. Same `Authorization` on Enable and Execute.
2. Kill switch **DISENGAGED** first.
3. Enable AGT-003 and AGT-014 **before** execute.
4. AGT-003 for `analyze_story`. AGT-014 does **not** get `analyze_story`.
5. Do **not** engage kill until case 5 is captured.

Auth for local only:

```
Authorization: Bearer test-token-123
X-Agbofa-Test-Tenant: tenant-a
```

(`PLANE_TEST_AUTH=true`, `AGBOFA_ENV=development`.)

Use `curl.exe` and `--%` in PowerShell, or run from cmd.

### 11.0 Disengage kill + enable

```bat
curl.exe -sS -D - -X POST http://127.0.0.1:8080/rpc/autonomy.v1.AutonomyService/KillSwitch -H "Authorization: Bearer test-token-123" -H "X-Agbofa-Test-Tenant: tenant-a" -H "Content-Type: application/json" --data-binary "{\"engage\":false}"

curl.exe -sS -D - -X POST http://127.0.0.1:8080/rpc/autonomy.v1.AutonomyService/EnableAgent -H "Authorization: Bearer test-token-123" -H "X-Agbofa-Test-Tenant: tenant-a" -H "Content-Type: application/json" --data-binary "{\"agent_id\":\"AGT-003\"}"

curl.exe -sS -D - -X POST http://127.0.0.1:8080/rpc/autonomy.v1.AutonomyService/EnableAgent -H "Authorization: Bearer test-token-123" -H "X-Agbofa-Test-Tenant: tenant-a" -H "Content-Type: application/json" --data-binary "{\"agent_id\":\"AGT-014\"}"
```

Save **HTTP status + body** for each.

### 11.1 Safe observe — expect SUCCEEDED

AGT-003 + `analyze_story`. `execution.Status` = `SUCCEEDED`, `provider_called` = false.  
This is **not** publication.

```json
{"agent_id":"AGT-003","brand_passed":true,"tools":[{"tool_id":"analyze_story","input":{"text":"DEV_TRUTH_FIXTURE: local observation"}}]}
```

POST `/v1/autonomy/execute`

### 11.2 Truth fail — expect BLOCKED / TRUTH_FAILED

AGT-014 + `publish_content` body containing `the earth is flat`.

```json
{"agent_id":"AGT-014","brand_passed":true,"tools":[{"tool_id":"publish_content","input":{"content_id":"c1","body":"the earth is flat","brand_identity_applied":true}}]}
```

### 11.3 Compliance live — expect NOT COMPLIANCE_FAILED

If you send `person@example.com`, expect **`TRUTH_UNAVAILABLE`**. Record as **NOT DEMONSTRATED** for Compliance, not PASS.

Unit file already covers isolated `COMPLIANCE_FAILED`.

### 11.4 Forbidden tool — expect FAILED / FORBIDDEN_TOOL

```json
{"agent_id":"AGT-014","brand_passed":true,"tools":[{"tool_id":"bypass_truth","input":{}}]}
```

### 11.5 Engage kill — expect kill_switch ENGAGED

```json
{"engage":true}
```

POST KillSwitch.

### 11.6 Execute after kill — expect BLOCKED / KILL_SWITCH_ENGAGED

Repeat 11.1. Must be `KILL_SWITCH_ENGAGED`.

### 11.7 Extra required live cases (not optional)

| Case | Expect |
|---|---|
| No `Authorization` | HTTP 401 |
| `Bearer not-the-token` | HTTP 401 |
| Tenant B header `X-Agbofa-Test-Tenant: tenant-b` Get execution of tenant-a id | deny / TENANT_MISMATCH |
| AGT-014 + `analyze_story` | `UNAUTHORIZED_TOOL` |

Write `INTEGRATION-WINDOWS.txt` with: timestamp, **product SHA**, each command, HTTP status, JSON, expected vs actual.

**6/6 is only true if 11.1–11.2 and 11.4–11.6 match the expected Error/Status.**  
11.3 must not be counted as Compliance PASS.

---

## 12. What you must not claim

- Production autonomy enabled (`Production` stays false).
- YouTube / provider publish from these tests.
- Handler persistence of `agent_executions` (migration exists; Execute does **not** INSERT).
- Linux Arena CERTIFIED.
- Coverage PASS without `go tool cover` numbers.
- Race PASS without `-race` actually running.

---

## 13. Single authoritative cert file

After **all** logs exist and match:

Update **only**:

- `docs/audit/phase08/PHASE-08-CERTIFICATION.md`
- `docs/audit/phase08-recertification/PHASE-08-RECERTIFICATION.md`

One status. No second heading.

```
PRODUCT TEST SHA: <full SHA that ran the commands>
FINAL DOCUMENTATION SHA: <sha of the evidence commit, after you have it>
REMOTE SHA: must equal FINAL after push
```

If any mandatory log is empty, FAIL, or SHA-mismatched: status is **BLOCKED** or **FAILED**, not CERTIFIED.

Then:

```bat
git add docs/audit/phase08 docs/audit/phase08-recertification
git diff --check
git commit -m "docs(phase08): record Windows evidence at <PRODUCT_SHA>"
git push origin arena/01a01a0f-agbofa-nexus-ai
git rev-parse HEAD
git ls-remote origin arena/01a01a0f-agbofa-nexus-ai
```

LOCAL must equal REMOTE.  
Do not commit secrets, `.exe`, or PEMs.

---

## 14. Independent Gate 0 (Arena or a second person)

They will check, in order:

1. `git rev-parse HEAD` == `git ls-remote`
2. Cert file has **one** status
3. Every cited file exists, is non-empty when it claims output, and names `PRODUCT TEST SHA`
4. `GO-TEST.txt` has no `FAIL`
5. Race/vet files contain command + result (or a real CGO error labeled SKIPPED)
6. Integration JSON matches §11 expected codes
7. `NewPlane().Production == false`
8. No new secrets tracked

If that review is PASS, **then** Phase 09 implementation may start on **Windows**.

---

## 15. Phase 09 (only after Gate 0 PASS)

Still later. Do not start now.

When authorized: forensic audit of existing limiters first; no second publishing engine; no production autonomy; measure Phase 09 coverage independently; Windows live 429 tests.

---

## 16. Checklist (print and tick)

- [ ] Windows 11 + Go 1.22 + PostgreSQL 16 recorded
- [ ] `PRODUCT_SHA` frozen; working tree clean of product edits
- [ ] RS256 PEMs set; no HS256
- [ ] `nexus` and `nexus_test`; `AGBOFA_TEST_DATABASE_URL` set
- [ ] `go test ./...` EXIT 0, full log kept
- [ ] `go test -race` log or real CGO error (SKIPPED ≠ PASS)
- [ ] `go vet` log with EXIT 0
- [ ] coverage measured or NOT MEASURED with error text
- [ ] Node 49/49 log
- [ ] `/healthz` and `/readyz` 200
- [ ] Kill **disengaged** before functional Execute cases
- [ ] 11.1 SUCCEEDED
- [ ] 11.2 TRUTH_FAILED
- [ ] 11.3 not labeled Compliance PASS
- [ ] 11.4 FORBIDDEN_TOOL
- [ ] 11.6 KILL_SWITCH_ENGAGED
- [ ] 401 unauthenticated captured
- [ ] One cert status; SHAs consistent; pushed; local=remote
- [ ] Wait for independent Gate 0 PASS before Phase 09
