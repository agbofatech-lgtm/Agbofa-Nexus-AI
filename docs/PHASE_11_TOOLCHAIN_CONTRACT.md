# Phase 11 Toolchain Contract

**Project:** Agbofa Nexus AI
**Organization:** Agbofa Technologies
**Authorized by:** Agbofa Benjamin, Owner
**Purpose:** Declare the exact Phase 11 local security environment toolchain contract
**Historical certified baseline:** `afa30708f5d1c5178824d014a58fb60dca1a7299`

## Scope and status

This contract declares required versions and verification behavior. It does **not** claim that tools are currently installed, operational, authentic, signed, attested, or provenance-certified.

Every tool must separately pass:

1. executable discovery;
2. exact version verification;
3. platform/architecture compatibility;
4. artifact hash verification where available;
5. signature/attestation verification where officially available;
6. operational verification in the authorized environment.

Until that evidence exists, provenance/certification status is **PENDING**.

## Required versions

| Component | Required version | Provenance/certification status |
|---|---:|---|
| Go | 1.22.12 | Pending independent artifact verification |
| Buf | 1.32.2 | Pending independent artifact verification |
| protoc | 25.3 | Pending independent artifact verification |
| Gitleaks | 8.18.4 | Pending independent artifact verification |
| Docker | 29.6.1 | Pending independent artifact verification and runtime verification |
| PostgreSQL | 16.14 | Pending independent artifact and service verification |
| Playwright | 1.62.1 | Pending npm integrity and browser verification |
| govulncheck | 1.7.0 | Pending independent artifact/build verification |
| gosec | 2.21.1-dev | **Development build**; provenance and certification pending |
| Node.js | 22.22.3 | Pending environment verification |
| pnpm | 11.22.0 | Pending Corepack/package integrity verification |
| TypeScript | 5.9.3 | Pending lockfile/package integrity verification |
| Git | 2.55.0 | Pending independent artifact verification |

## gosec development-build rule

`gosec 2.21.1-dev` is explicitly an identified **development build**, not a stable certified release. Verification must record:

- exact executable path;
- exact version output;
- SHA-256;
- source/provenance;
- build metadata, if available;
- Go compatibility;
- reason for using this development build.

If provenance cannot be established, the required classification is:

```text
VERSION VERIFIED
PROVENANCE UNVERIFIED
```

No report may silently describe this build as a stable release.

## pnpm lifecycle-build policy

The only approved dependency lifecycle builds are:

```yaml
allowBuilds:
  sharp: true
  unrs-resolver: true
```

Rules:

- unknown lifecycle builds fail closed;
- no wildcard permission;
- no blanket/global lifecycle-script enablement;
- no `dangerouslyAllowAllBuilds`;
- no automatic approval of newly discovered packages;
- any additional package requires separate Owner/security review;
- a frozen installation must not change `pnpm-lock.yaml`, package versions, or unrelated tracked files.

## Verification script

`scripts/phase11/verify-toolchain.ps1` is a read-only verifier. It may discover executable paths, invoke version commands, and hash executable files. It must not install, upgrade, download, configure, or modify tools or repository files.

## Security boundary

This contract does not authorize:

- authentication or authorization implementation;
- JWT/session/CSRF/RLS implementation;
- dependency upgrades;
- protobuf generation;
- database initialization/migration;
- Docker startup;
- browser installation;
- production deployment or credential access.

Wave 1 implementation remains subject to separate explicit Owner authorization.
