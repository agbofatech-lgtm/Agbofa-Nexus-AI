# LAYER 3 — Database & Data Reality

Engine: PostgreSQL via `pgx` (`libs/go/pkg/database`). Runtime DB name documented as `nexus`; tests `nexus_test`.

**This audit did not connect to PostgreSQL.** Schema classification is from migrations + repositories. Persistence **runtime** = UNKNOWN in Arena.

## Tables (migrations)

| Table | Migration | Repository consumer | Product consumer | Unused? |
|---|---|---|---|---|
| tenants, users, refresh_tokens, config_audit_log | foundation_schema | tenant/user/refresh repos | Auth | no |
| role_policies, authorization_audit_log | authorization_policies | policy/audit repos | Authz (partial; Decide() is in-process roles) | PARTIAL |
| configuration_bundles | prod01_integrity | configuration repo | config | unknown runtime |
| oauth_states, social_connections, distribution_jobs, distribution_attempts, publication_records, distribution_audit | phase03_social | social/distribution/queue | Social + publish | no (if worker runs) |
| analytics_snapshots | phase04_publishing | publish analytics | PARTIAL |
| autonomy_configs, autonomy_domains, approval_policies, approval_tickets, autonomy_runs, governed_memories, scenario_records, ai_usage_ledger, autonomy_audit | phase05_autonomy | AutonomyStore | Autonomy HTTP | no |

## Constraints / RLS

- FORCE ROW LEVEL SECURITY on tenants, users, refresh_tokens, social/oauth/jobs, autonomy tables (phase 03/05 SQL).
- Isolation predicate: `tenant_id::text = current_setting('app.current_tenant', true)` — unset GUC ⇒ deny.
- Application must set GUC in `InTenantTx`. **Runtime proof of RLS:** not executed here.

## Encryption at rest (application)

- OAuth tokens / PKCE: AES-GCM `TokenBox` (`social/crypto.go`), key `AGBOFA_SECRET_SOCIAL_TOKEN_KEY`.
- DB-level TDE: UNKNOWN (not in repo).
- JWT private keys: env PEM, gitignored `*.pem` (binary gitignore issue aside).

## Transactions

`InTenantTx` wraps tenant GUC + SQL. Queue claim uses `FOR UPDATE SKIP LOCKED` (source). Runtime: UNKNOWN here.

## Do not treat unused tables as features

`role_policies` may not drive `authz.Decide()` (in-memory role matrix). That is INCONSISTENT: table EXISTS, engine may not read it.

Empty services have **zero** tables.
