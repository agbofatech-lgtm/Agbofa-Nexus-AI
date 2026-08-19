# PROD-00 — Configuration and Secret Management

**Phase:** 01  
**Subphase:** PROD-00  
**Gap addressed:** GAP-SECRET-001  
**Status:** IMPLEMENTED + STATIC INSPECTED + RUNTIME VERIFIED for `f2a0b410205cf5a0b3da00edbf3ad853d7b72cdf`  
**Certification:** NOT CERTIFIED — awaiting certification review  
**Runtime evidence:** `docs/implementation/phase01/PROD-00_RUNTIME_EVIDENCE.md`  

## What was implemented

Shared library: `libs/go/pkg/config`

| Abstraction | Role |
|---|---|
| `RuntimeConfig` | Typed process configuration |
| `Secret` | Opaque secret that redacts under fmt/JSON |
| `SecretProvider` | Secret resolution interface |
| `EnvProvider` | Environment-backed secrets |
| `FileProvider` | Filesystem / mounted-file secrets |
| `StaticProvider` | Test-only; cannot be selected from env |
| Managed providers | `aws_secrets_manager` and `vault` are reserved and fail closed |

Startup refuses unsafe production configuration, including:

- missing `AGBOFA_ENV`
- missing database URL secret
- missing JWT signing key
- invalid issuer or audience
- `alg=none`
- insecure cookies in staging/production
- wildcard CORS in staging/production
- unavailable managed secret backend

JWT keys are identified by `kid`. Retired keys remain usable for verification inside an explicit `NOT_BEFORE` / `NOT_AFTER` window. An expired active signing key prevents startup.

## Secrets policy

- No secrets in Git, source, logs, errors, snapshots, or `.env.example` values that are real.
- `.env` is gitignored. Use `.env.example` as the template only.
- `RuntimeConfig.PublicSnapshot()` is the only supported startup diagnostic map.

## Arena static validation

Arena cannot execute `go test`. Static review covers source inspection, secret-redaction tests as written, and git cleanliness.

## Developer runtime evidence

A developer-runtime PASS was recorded against:

```text
f2a0b410205cf5a0b3da00edbf3ad853d7b72cdf
```

See `PROD-00_RUNTIME_EVIDENCE.md`. That result does not certify later commits.

PROD-01 is not started and is not authorized by this record.

## Developer runtime evidence template

Use this template for any retest. Do not include secret values.

```text
PHASE: 01
SUBPHASE: PROD-00
COMMIT: <sha>
ENVIRONMENT: developer-runtime
OS:
GO:
POSTGRESQL: not required for this subphase
DOCKER: not required for this subphase
BUF: not required for this subphase
PROTOC: not required for this subphase
NODE:
NPM:
COMMAND: cd libs/go && go test ./pkg/config/... && go vet ./pkg/config/... && go build ./pkg/config/...
RESULT:
EXIT CODE:
RELEVANT OUTPUT:
```
