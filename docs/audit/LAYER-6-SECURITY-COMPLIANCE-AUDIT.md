# LAYER 6 — Security & Compliance

## Findings

| ID | Severity | Area | Reality | Evidence |
|---|---|---|---|---|
| SEC-P0-01 | P0 | YouTube OAuth / token exchange | UNVERIFIED / historically FAIL | Callback `invalid_oauth` vs Connect-only source; requires host rebuild proof |
| SEC-P0-02 | P0 | Real publish | BLOCKED | No proven provider publication; cannot claim secure publish path end-to-end |
| SEC-P0-03 | P0 | Committed `server.exe` | EXISTS | 15.5MB binary in git (`40de613`) — supply-chain / accidental release risk |
| SEC-P1-01 | P1 | BFF JWT | MISSING verify | Session route decodes claims without signature; backend still verifies RPC |
| SEC-P1-02 | P1 | CSRF | ORPHANED | Go CSRF unused by Next BFF |
| SEC-P1-03 | P1 | Rate limit | PARTIAL | In-memory Map; X-Forwarded-For client-controlled |
| SEC-P1-04 | P1 | Cookie Secure | PARTIAL | Secure only when `AGBOFA_ENV=production` |
| SEC-P1-05 | P1 | Refresh rotation | PARTIAL | Refresh cookie set; no BFF rotate/revoke route found |
| SEC-P1-06 | P1 | RLS runtime | IMPLEMENTED-NOT-VERIFIED | FORCE RLS in SQL; not proven in this audit |
| SEC-P1-07 | P1 | Authz vs DB policies | INCONSISTENT | `Decide()` in-process roles; `role_policies` table may be unused |
| SEC-P2-01 | P2 | Security headers | MISSING | No CSP/HSTS/XFO found in web/foundation grep |
| SEC-P2-02 | P2 | Protobuf unused | INCONSISTENT | JSON RPC bypasses generated contracts |
| SEC-P2-03 | P2 | Memory JSON schema | INCONSISTENT | PascalCase vs snake_case |
| SEC-P2-04 | P2 | `.gitignore` binary | INCONSISTENT | git stores binary gitignore |
| SEC-P2-05 | P2 | Logging PII | UNKNOWN | inbound path logged; bodies claimed omitted |
| SEC-P3-01 | P3 | SBOM / container scan | MISSING | infra templates only |
| SEC-P3-02 | P3 | TLS termination | UNKNOWN | not in repo |
| SEC-P3-03 | P3 | Backups | DOC ONLY | `infrastructure/backup/BACKUP_DR_STRATEGY.md` |
| SEC-P4-01 | P4 | GDPR/CCPA/SOC2 | DOCUMENTATION | registries, not controls |

## Positive controls (source)

- Argon2id passwords
- RS256 JWT nbf/exp wall-clock (`ea14a0f`)
- TokenBox fail-closed compose (`7e5e833`)
- Tenant consume OAuth state (`a4a221f`)
- Kill-switch gates Schedule
- ApplyMemoryAsPrivilege always 403
- Secrets via `AGBOFA_SECRET_*`, redact helpers
- Brand gate `BRAND_VALIDATION_FAILED`

## Gap register pointer

See `GAP-REGISTER.md`. This layer does **not** claim the system is secure.
