# Phase 08 recertification — environment (Windows reproduction attempt)

- timestamp: 2026-08-22T08:47:51Z
- START SHA: `0b25e0996fbc2d8784e02bcea4382096b313d9ce`
- TESTED SHA: `0b25e0996fbc2d8784e02bcea4382096b313d9ce`
- branch: `arena/01a01a0f-agbofa-nexus-ai`
- remote at inspect: `0b25e0996fbc2d8784e02bcea4382096b313d9ce`
- working tree before evidence write: clean

| Tool | Command | Actual result |
|---|---|---|
| OS | `uname -a` / `/etc/os-release` | Linux e2b.local 6.1.158+ x86_64; Debian GNU/Linux 12 (bookworm). **NOT Windows 11** |
| Go | `go version` | **NOT AVAILABLE** (`go: command not found`) |
| PostgreSQL | `psql --version` | **NOT AVAILABLE** (`psql: command not found`) |
| Docker | `docker --version` | **NOT AVAILABLE** |
| Node | `node --version` | v22.22.3 |
| npm | `npm --version` | 10.9.8 |
| git | `git --version` | git version 2.39.5 |

Required Windows reproduction environment (not this host):

- Windows 11
- Go 1.22
- PostgreSQL 16
- RS256 PEMs (not HS256)
- `AGBOFA_SECRET_SOCIAL_TOKEN_KEY` 32 bytes
- `PLANE_TEST_AUTH=true` only with `AGBOFA_ENV=development|test`

Mandatory Go / Postgres / live Foundation tests remain **BLOCKED** here.
Product code was not modified in this attempt.
