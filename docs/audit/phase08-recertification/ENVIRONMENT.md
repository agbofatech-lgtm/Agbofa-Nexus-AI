# Phase 08 recertification — environment

- timestamp: 2026-08-22T08:41:33Z
- SHA: `bc744a118cca3f041eb9067e0b0facd12233ac18`
- branch: arena/01a01a0f-agbofa-nexus-ai

| Tool | Command | Result |
|---|---|---|
| OS | `uname -a` | Linux e2b.local 6.1.158+ x86_64 (Arena, not Windows 11) |
| Go | `go version` | **NOT AVAILABLE IN CURRENT ENVIRONMENT** |
| Node | `node --version` | v22.22.3 |
| npm | `npm --version` | 10.9.8 |
| PostgreSQL | `psql --version` | **NOT AVAILABLE IN CURRENT ENVIRONMENT** |
| Docker | `docker --version` | **NOT AVAILABLE IN CURRENT ENVIRONMENT** |
| Docker Compose | — | **NOT AVAILABLE IN CURRENT ENVIRONMENT** |

Required Windows reproduction environment (not this host):

- Windows 11
- Go 1.22
- PostgreSQL 16
- RS256 PEM secrets (not HS256)
- `PLANE_TEST_AUTH=true` only with `AGBOFA_ENV=development|test`

Mandatory Go / Postgres / live Foundation tests are **BLOCKED** here.
