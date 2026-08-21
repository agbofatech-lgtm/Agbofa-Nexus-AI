# LAYER 4 — External Provider Reality

No live provider calls were made in this audit.

## AI

| Provider | SDK/client | Config | Auth | API calls | Runtime evidence |
|---|---|---|---|---|---|
| OpenAI | custom HTTP `libs/go/pkg/llm/openai.go` | `AGBOFA_SECRET_*` openai key | Bearer | `Complete` via gateway | httptest unit tests EXIST; **real api.openai.com NOT EXECUTED** in evidence files |
| Anthropic | custom HTTP `anthropic.go` | secret | x-api-key | same | same |
| Gemini | MISSING | — | — | — | — |
| Fake | `llm/fake.go` | tests | — | unit | MOCK |

Gateway fail-closed if provider missing. Cost ledger ESTIMATED from registry micros — not invoices.

## Social / publishing

| Platform | Catalog | OAuth client | Token mgmt | Publish adapter | Runtime |
|---|---|---|---|---|---|
| YouTube | EXISTS | Google authorize/token + PKCE | TokenBox AES-GCM | `youtube.go` Data API; empty id → not invent PUBLISHED | Windows OAuth historically `invalid_oauth`; later docs claim connect PASS; **real upload BLOCKED** (no test video / callback contradiction) |
| X | catalog URLs only | no adapter in Router except YouTube | — | MISSING adapter | NOT RUNTIME |
| LinkedIn | catalog only | — | — | MISSING | NOT RUNTIME |
| Meta | catalog only | — | — | MISSING | NOT RUNTIME |
| TikTok, Threads, Pinterest, Reddit, Telegram, WhatsApp | **frontend fixtures only** | MISSING backend | — | MISSING | DEMO |

Router explicitly registers YouTube only (`router.go`).

## Other

| Integration | Classification |
|---|---|
| Object storage | SCAFFOLDED `.gitkeep` |
| Payments / billing | MISSING |
| Email / SMS | MISSING |
| Webhooks inbound | MISSING |
| Analytics vendor | MISSING (frontend simulated) |
| Notifications | DEMO header popovers |

## Webhooks / rate limits (provider)

Social engine classifies RATE_LIMIT failures. No provider webhook server.
