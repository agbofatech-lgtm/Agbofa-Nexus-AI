# Phase 02 — Real AI Providers Evidence

**Implementation:** COMPLETE  
**Runtime (real provider):** PENDING / BLOCKED until developer credentials and network access exist  

```text
PHASE: 02
HEAD: <filled after push>
ENVIRONMENT: arena-sandbox
GO: unavailable
REAL PROVIDER REQUEST: NOT EXECUTED
RESULT: PENDING
```

Unit tests (httptest / fake provider) are **not** a real-provider PASS.

Developer runtime later:

```bash
cd libs/go
go test ./pkg/llm/...

# Real provider — only with a disposable key in the developer environment
export AGBOFA_SECRET_AI_OPENAI_API_KEY=...   # do not paste into Arena
go test ./pkg/llm/... -run TestOpenAICompleteAgainstHTTPTestServer
```

A live request against api.openai.com or api.anthropic.com is required before Phase 02 certification.
