# PROD-00 — Configuration and Secret Management

**Phase:** 01  
**Subphase:** PROD-00  
**Gap addressed:** GAP-SECRET-001  
**Status:** IMPLEMENTED — STATIC VALIDATION ONLY IN ARENA  
**Runtime verification:** REQUIRED in the developer environment  

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

## Developer runtime evidence required

Use this template. Do not include secret values in the output you return.

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
