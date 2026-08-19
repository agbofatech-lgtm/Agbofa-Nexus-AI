# PROD-00 — Developer Runtime Evidence

**Phase:** 01  
**Subphase:** PROD-00  
**Evidence commit:** `f2a0b410205cf5a0b3da00edbf3ad853d7b72cdf`  
**Recorded:** 2026-08-19  
**Certification:** NOT CERTIFIED — runtime evidence accepted for the evidence commit only  

This evidence does not certify any later commit.

```text
PHASE: 01
SUBPHASE: PROD-00
COMMIT: f2a0b410205cf5a0b3da00edbf3ad853d7b72cdf
ENVIRONMENT: developer-runtime
OS: Windows / PowerShell
GO: available (exact version not supplied)
POSTGRESQL: not required for this subphase
DOCKER: not required for this subphase
BUF: not required for this subphase
PROTOC: not required for this subphase
NODE: not supplied
NPM: not supplied
COMMAND: go test ./pkg/config/... ; go vet ./pkg/config/... ; go build ./pkg/config/...
RESULT: PASS
EXIT CODE: 0 (reported PASS for all three commands)
RELEVANT OUTPUT:
  go test ./pkg/config/...  PASS
  ok github.com/agbofa/nexus/libs/go/pkg/config
  go vet ./pkg/config/...   PASS
  go build ./pkg/config/... PASS
```

Reported passing tests included:

- TestLoadRejectsAlgNone
- TestLoadRejectsWildcardCORSInProduction
- TestLoadRejectsUnavailableManagedProvider
- TestJWTRotationWindow
- TestPublicSnapshotAndJSONOmitSecrets
- TestEnvProviderMapsSecretNames
- TestFileProviderReadsNestedAndFlatNames
- TestFileCandidatesIncludeSlashAndNativeNestedPaths
- TestFileProviderRejectsTraversal
- TestManagedProvidersFailClosed
- TestStaticProviderCannotBeSelectedFromFactory
- TestRedactRemovesCredentialShapes
- TestContainsSecret
- TestSecretNeverFormatsRawValue
- TestSecretEqualUsesValueNotName

## SHA binding

| Ref | SHA |
|---|---|
| Runtime-tested commit | `f2a0b410205cf5a0b3da00edbf3ad853d7b72cdf` |
| Later test-only commits (not covered by this evidence) | `a9098b193f2c4e1178b2d197f0bf315f29d4580a`, `31a3cd07edf5b8145fb5119ce6c77108712624ed` |
| Branch tip at evidence recording (before this document commit) | `31a3cd07edf5b8145fb5119ce6c77108712624ed` |

Those later commits change only `libs/go/pkg/config/provider_test.go`. They are **not** certified by the `f2a0b41` run.

## Arena verification of git state at recording

```text
BRANCH: arena/01a01a0f-agbofa-nexus-ai
WORKTREE: clean
f2a0b41 present locally: yes
f2a0b41 ancestor of current HEAD: yes
origin/arena/01a01a0f-agbofa-nexus-ai (ls-remote): 31a3cd07edf5b8145fb5119ce6c77108712624ed
```

`f2a0b41` is on the pushed branch history. It is not the current branch tip.
