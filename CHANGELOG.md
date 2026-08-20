# Changelog

This project follows Keep a Changelog conventions for release notes.

## 2026-08-20

- Phase 03: added OAuth state/PKCE, AES-GCM token box, branding gate, distribution state machine, social/distribution persistence, and BFF routes. Real platform OAuth/publish remain pending.
- Phase 02: added AI gateway, model registry, OpenAI/Anthropic HTTP adapters, usage accounting, and BFF `/api/v1/ai` routes. Real-provider runtime remains pending.

## 2026-08-19

- PROD-01: added pgx pool, deterministic SQL migrations, and concrete foundation repositories. Runtime PostgreSQL verification is required.
- PROD-00: added fail-closed runtime configuration and secret-provider abstractions under `libs/go/pkg/config`. Runtime verification remains required.

## 2026-08-07

- Established repository foundation governance and IMP-001 authorization controls.
