# PHASE 07-B/C evidence

## server.exe forensic

| Field | Value |
|---|---|
| Path | `server.exe` (repo root) |
| Size | 15536640 |
| SHA-256 | `d26bc4eb5035993bc9b5177d790cddb096aeaa099ba7ff037fdfe24289462679` |
| Git | was tracked `100644` from `40de613` |
| PEM `BEGIN PRIVATE KEY` in blob | 0 hits |
| Incident | no live credential material found |
| Action | `git rm server.exe`; `.gitignore` `*.exe` (also stripped NUL gitignore) |

## JWT (G-006)

BFF `verifyAccessToken`: RS256 only, kid, iss, aud, nbf, exp, fail-closed without PEM.  
Session GET no longer accepts unsigned payloads.

## CSRF (G-007)

Mutating `/api/v1/*` except login: Origin allow + `agbofa_csrf` cookie vs `X-CSRF-Token`.  
Login sets cookie. Logout/kill-switch send header.

## Rate limit (G-008)

Keys: `sub:{jwt.sub}` or `anon:ua:{user-agent}`. Not X-Forwarded-For. Store still process-local.

## Headers (G-013)

X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy; HSTS when `AGBOFA_ENV=production`.
