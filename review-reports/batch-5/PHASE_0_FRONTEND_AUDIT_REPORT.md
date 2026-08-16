# PHASE 0 AUDIT REPORT — AGBOFA NEXUS AI

**Audit date:** 2026-08-16

**Scope:** frontend and directly related monorepo/tooling files only

**Inspection mode:** read-only for product/frontend implementation; this report is the sole repository artifact created

**Snapshot:** `9ee0483f7fe38638226e3fbec56a0d9857ca298d`

## Executive Finding

This repository does **not** contain an existing frontend to replace. It contains nine empty `.gitkeep` placeholders, two minimal workspace files, and no JavaScript/TypeScript/CSS application source. `apps/web/` does not exist. There is no `package.json`, lockfile, Next.js configuration, Tailwind configuration, TypeScript configuration, ESLint/Prettier frontend configuration, component, hook, store, type, frontend test, API route, BFF implementation, image, icon, font, favicon, or web manifest.

Therefore the replacement is a **greenfield frontend build**, not a removal of an old implementation. There are zero old components or design-system files to replace. The only deletions are placeholder files when their directories receive real content.

A second material finding is that the repository source specification defines **two applications**—`apps/newsroom` and `apps/reader`—not `apps/web`. Creating a unified `apps/web` would be an architecture change and is not recommended without an approved decision replacing the documented split.

## Git Branch and Delivery

- Requested branch: `feature/batch-5/phase-0-discovery` — **not created**. This Arena session is fixed to `arena/01a00bd2-agbofa-nexus-ai` and cannot switch/create another working branch.
- Working branch: `arena/01a00bd2-agbofa-nexus-ai`
- Requested base: `develop` — **does not exist locally or on `origin`** as of the audit.
- Available/default base: `agent-recovery-imp-006` at `9ee0483`.
- Audit commits: 1 documentation-only commit.
- Pull request: [#4 — Phase 0: Discovery & Audit — Frontend Removal Plan](https://github.com/agbofatech-lgtm/Agbofa-Nexus-AI/pull/4) (targets available default base `agent-recovery-imp-006` because `develop` is absent).
- Pull-request labels: `phase-0`, `audit`, `frontend` (created on the repository).
- Requested reviewer `@your-team`: not requested because it is a placeholder, not a resolvable repository user/team. `CODEOWNERS` mentions `@agbofa/frontend-platform-team` only for `libs/node/`; app/package ownership must be added.

## Governance Constraint

Repository governance currently marks `IMP-014 — Frontend Foundation` and `IMP-015 — Enterprise Frontend Centers` as **not eligible**, **not authorized**, and production code generation **prohibited**. This report is a planning/audit artifact only. Before Phase 1 code generation, the implementation card, architecture validation gate, implementation authorization gate, dependencies, and human approval must be resolved.

Authoritative evidence inspected:

- `implementation-cards/drafts/CARD-IMP-014.md`
- `implementation-cards/drafts/CARD-IMP-015.md`
- `docs/implementation/IMPLEMENTATION_SEQUENCE_REGISTER.md`
- `docs/indexes/UI_SCREEN_REGISTRY.md` and `docs/indexes/json/ui.json`
- Source Volume 7–8 lines `94074–102725`
- Source Volume 33–34 lines `211340–215208`
- Source Volume 35–36 lines `215209–218627`

## Repository Structure — Actual

```text
Agbofa-Nexus-AI/
├── 03-Frontend/
│   └── .gitkeep
├── apps/
│   ├── newsroom/
│   │   └── .gitkeep
│   └── reader/
│       └── .gitkeep
├── assets/
│   └── .gitkeep
├── libs/node/packages/
│   └── .gitkeep
├── packages/
│   ├── api-client/.gitkeep
│   ├── config/.gitkeep
│   ├── ui/.gitkeep
│   └── utils/.gitkeep
├── pnpm-workspace.yaml
└── turbo.json
```

### Requested `apps/web/` Structure — Presence Check

| Requested area | Actual state |
|---|---|
| `apps/web/` | Missing |
| `apps/web/app/` and route groups | Missing |
| `apps/web/components/` | Missing |
| `apps/web/lib/` | Missing |
| `apps/web/hooks/` | Missing |
| `apps/web/stores/` | Missing |
| `apps/web/types/` | Missing |
| `apps/web/styles/` | Missing |
| `apps/web/public/` | Missing |
| `apps/web/tests/` | Missing |
| `apps/web/app/api/` | Missing |

## Complete Existing File Inventory, Quality, and Classification

Quality is assessed against the requested definitions. Empty placeholders are `PARTIAL`: they preserve intended directories but provide no frontend capability.

| # | Path | Purpose | Quality | Action | Reason |
|---:|---|---|---|---|---|
| 1 | `03-Frontend/.gitkeep` | Placeholder for frontend documentation area | **PARTIAL** | **DELETE** | Remove when real frontend documentation is added. |
| 2 | `apps/newsroom/.gitkeep` | Empty newsroom application placeholder | **PARTIAL** | **DELETE** | Remove in Phase 1 when the source-specified newsroom app is scaffolded. |
| 3 | `apps/reader/.gitkeep` | Empty public reader application placeholder | **PARTIAL** | **DELETE** | Remove in Phase 1 when the source-specified reader app is scaffolded. |
| 4 | `assets/.gitkeep` | Empty shared asset placeholder | **PARTIAL** | **DELETE** | Remove when approved brand assets are supplied; no usable assets exist. |
| 5 | `libs/node/packages/.gitkeep` | Empty shared Node package placeholder | **PARTIAL** | **DELETE** | Remove when shared Node packages are implemented or confirm the directory is unnecessary. |
| 6 | `packages/api-client/.gitkeep` | Empty generated API client placeholder | **PARTIAL** | **DELETE** | Remove when the generated typed client package is created; there is no client to preserve. |
| 7 | `packages/config/.gitkeep` | Empty shared configuration placeholder | **PARTIAL** | **DELETE** | Remove when ESLint, TypeScript, and Prettier presets are created. |
| 8 | `packages/ui/.gitkeep` | Empty design-system placeholder | **PARTIAL** | **DELETE** | Remove when tokens and components are created; no old design system exists. |
| 9 | `packages/utils/.gitkeep` | Empty utilities package placeholder | **PARTIAL** | **DELETE** | Remove when approved shared utilities are created. |
| 10 | `pnpm-workspace.yaml` | Workspace globs for apps, packages, and libs/node/packages | **GOOD** | **KEEP** | Correctly includes the source-specified monorepo areas. |
| 11 | `.editorconfig` | Repository-wide editor formatting baseline | **GOOD** | **KEEP** | Small, clear, and suitable for TypeScript/CSS work. |
| 12 | `turbo.json` | Basic Turborepo lint/test/build pipeline | **PARTIAL** | **IMPROVE** | Add dev/typecheck/storybook/E2E tasks, environment inputs, and cache/output rules. |
| 13 | `.gitignore` | Repository ignore baseline | **PARTIAL** | **IMPROVE** | Add .next, .turbo, Playwright, Storybook, Lighthouse, and frontend generated outputs. |
| 14 | `.pre-commit-config.yaml` | Generic whitespace/YAML/JSON/security hooks | **PARTIAL** | **IMPROVE** | Add affected frontend lint/typecheck/test gates after manifests exist. |
| 15 | `.github/CODEOWNERS` | Ownership rules with only libs/node mapped to frontend team | **PARTIAL** | **IMPROVE** | Add apps/newsroom, apps/reader, and packages frontend ownership. |
| 16 | `infrastructure/docker/Dockerfile.node.template` | Generic Node/Next.js image template | **PARTIAL** | **IMPROVE** | Preserve now; later use workspace-aware pruned installs and Next standalone runtime output. |

**Totals:** 16 audited existing frontend/frontend-adjacent files; 0 POOR, 14 PARTIAL, 2 GOOD, 0 EXCELLENT. Actions: 9 DELETE, 2 KEEP, 0 REPLACE, 5 IMPROVE.

### App Router Files

- None. There is no `app/` directory under any application.
- No pages, layouts, loading states, error boundaries, route handlers, metadata routes, API routes, middleware, or global styles exist.

### Components

- None under `apps/`, `packages/ui/`, or anywhere else in the implementation tree.

### Lib Files / BFF / Services / API Client

- No frontend `lib/`, BFF client, domain service, HTTP client, query hook, or generated client exists.
- `packages/api-client/.gitkeep` is an empty placeholder, not a preservable BFF/API implementation.
- Backend contracts under `api/` were not audited or modified.

### Hooks / Stores / Types

- Hooks: 0
- Stores: 0
- TypeScript type files: 0

### Assets

- Usable frontend assets: 0
- `assets/.gitkeep` is empty.
- No logo, icon, favicon, web manifest, font, illustration, photo, SVG, PNG, JPEG, WebP, GIF, ICO, WOFF/WOFF2, TTF, or OTF exists outside preserved source/extraction/documentation areas.

### Tests

- Frontend unit tests: 0
- Frontend component tests: 0
- Frontend integration tests: 0
- Frontend E2E/accessibility/performance/visual tests: 0

### Configuration Presence

| File/configuration | State | Action |
|---|---|---|
| Root/app `package.json` | Missing everywhere | CREATE |
| `pnpm-lock.yaml` | Missing | CREATE |
| `next.config.*` | Missing | CREATE per app |
| `tailwind.config.*` | Missing | CREATE per app/package per approved Tailwind version |
| `postcss.config.*` | Missing | CREATE |
| `tsconfig.json` | Missing | CREATE |
| `.eslintrc*` / `eslint.config.*` | Missing | CREATE flat config |
| `.prettierrc*` / Prettier config | Missing | CREATE |
| Vitest config | Missing | CREATE |
| Playwright config | Missing | CREATE |
| Storybook config | Missing | CREATE |
| Lighthouse config | Missing | CREATE |
| `pnpm-workspace.yaml` | Present; GOOD | KEEP |
| `turbo.json` | Present; PARTIAL | IMPROVE |

## Canonical UI Inventory

The generated UI registry contains 48 screens. Every item is `Not started`; every route field says route details are pending. These are requirements, not existing files.

| ID | Screen | Audience | Source screen | Implementation |
|---|---|---|---|---|
| UI-001 | Landing Page | Brand | `SCR-001` | Not started |
| UI-002 | Login | Auth | `SCR-002` | Not started |
| UI-003 | Registration | Auth | `SCR-003` | Not started |
| UI-004 | Password Recovery | Auth | `SCR-004` | Not started |
| UI-005 | Multi-Factor Authentication | Auth | `SCR-005` | Not started |
| UI-006 | Onboarding Flow | UX | `SCR-006` | Not started |
| UI-007 | Workspace Selection | UX | `SCR-007` | Not started |
| UI-008 | AI Newsroom Dashboard | Editorial | `SCR-010` | Not started |
| UI-009 | Executive Dashboard | Executive | `SCR-011` | Not started |
| UI-010 | Custom Dashboard Builder | UX | `SCR-012` | Not started |
| UI-011 | Story Pipeline (All Stories) | Editorial | `SCR-020` | Not started |
| UI-012 | Story Pipeline (Kanban View) | Editorial | `SCR-021` | Not started |
| UI-013 | Story Detail / Editorial Workspace | Editorial | `SCR-022` | Not started |
| UI-014 | Story Graph Viewer | Editorial | `SCR-023` | Not started |
| UI-015 | Breaking News Centre | Editorial | `SCR-024` | Not started |
| UI-016 | Verification Centre | Editorial | `SCR-025` | Not started |
| UI-017 | Human Review Queue | Editorial | `SCR-026` | Not started |
| UI-018 | Quality Assurance Dashboard | Editorial | `SCR-027` | Not started |
| UI-019 | Corrections & Retractions | Governance | `SCR-028` | Not started |
| UI-020 | Audit Logs | Governance | `SCR-029` | Not started |
| UI-021 | Knowledge Base | Editorial | `SCR-029b` | Not started |
| UI-022 | Article Editor | Content | `SCR-030` | Not started |
| UI-023 | Headline Studio | Content | `SCR-031` | Not started |
| UI-024 | Image Studio | Content | `SCR-032` | Not started |
| UI-025 | Video Studio | Content | `SCR-033` | Not started |
| UI-026 | Audio Studio | Content | `SCR-034` | Not started |
| UI-027 | Content Templates | Content | `SCR-035` | Not started |
| UI-028 | Publishing Centre | Distribution | `SCR-040` | Not started |
| UI-029 | Distribution Dashboard | Distribution | `SCR-041` | Not started |
| UI-030 | Calendar & Scheduler | Distribution | `SCR-042` | Not started |
| UI-031 | Platform Connectors | Admin | `SCR-043` | Not started |
| UI-032 | Analytics Dashboard | Analytics | `SCR-050` | Not started |
| UI-033 | Audience Intelligence | Analytics | `SCR-051` | Not started |
| UI-034 | Competitor Intelligence | Analytics | `SCR-052` | Not started |
| UI-035 | Revenue Dashboard | Business | `SCR-053` | Not started |
| UI-036 | AI Cost Dashboard | Admin | `SCR-054` | Not started |
| UI-037 | AI Agent Monitor | Admin | `SCR-060` | Not started |
| UI-038 | Agent Activity Timeline | Admin | `SCR-061` | Not started |
| UI-039 | Prompt Library | AI Engineering | `SCR-062` | Not started |
| UI-040 | Agent Trust Management | Admin | `SCR-063` | Not started |
| UI-041 | Workspace Settings | Admin | `SCR-080` | Not started |
| UI-042 | User Management | Admin | `SCR-081` | Not started |
| UI-043 | Role Management | Admin | `SCR-082` | Not started |
| UI-044 | Brand Configuration | Admin | `SCR-083` | Not started |
| UI-045 | API & Integrations | Admin | `SCR-084` | Not started |
| UI-046 | Billing & Subscription | Admin | `SCR-085` | Not started |
| UI-047 | System Health | Admin | `SCR-086` | Not started |
| UI-048 | Observability Dashboard | DevOps | `SCR-087` | Not started |

### Route-Gap Finding

The source Volume 33–36 route catalogue specifies newsroom routes such as `/login`, `/mfa`, `/forgot-password`, `/dashboard`, `/discovery`, `/verify`, `/create`, `/publish`, `/analyze`, and `/admin`. However, the canonical UI registry still marks all routes pending, and several registered experiences—registration, onboarding, workspace selection, custom dashboard builder, corrections, audit logs, knowledge base, multiple content studios, role/brand/integration settings, and observability—do not have an unambiguous route-to-file decision. Reader feed, reader story detail, and personalization routes requested in the phase names are also absent from the canonical registry and source app tree (the reader app is represented only by `app/...`).

No exact file path should be invented for those gaps. Before Phases 2–5 and unmatched enterprise screens, update/approve the route architecture and UI registry.

## Files to DELETE

- `03-Frontend/.gitkeep` — Remove when real frontend documentation is added.
- `apps/newsroom/.gitkeep` — Remove in Phase 1 when the source-specified newsroom app is scaffolded.
- `apps/reader/.gitkeep` — Remove in Phase 1 when the source-specified reader app is scaffolded.
- `assets/.gitkeep` — Remove when approved brand assets are supplied; no usable assets exist.
- `libs/node/packages/.gitkeep` — Remove when shared Node packages are implemented or confirm the directory is unnecessary.
- `packages/api-client/.gitkeep` — Remove when the generated typed client package is created; there is no client to preserve.
- `packages/config/.gitkeep` — Remove when ESLint, TypeScript, and Prettier presets are created.
- `packages/ui/.gitkeep` — Remove when tokens and components are created; no old design system exists.
- `packages/utils/.gitkeep` — Remove when approved shared utilities are created.

**Total: 9**

## Files to KEEP

- `pnpm-workspace.yaml` — Correctly includes the source-specified monorepo areas.
- `.editorconfig` — Small, clear, and suitable for TypeScript/CSS work.

**Total: 2**

## Files to REPLACE

- None. No old frontend implementation or design system exists.

**Total: 0**

## Files to IMPROVE

- `turbo.json` — Add dev/typecheck/storybook/E2E tasks, environment inputs, and cache/output rules.
- `.gitignore` — Add .next, .turbo, Playwright, Storybook, Lighthouse, and frontend generated outputs.
- `.pre-commit-config.yaml` — Add affected frontend lint/typecheck/test gates after manifests exist.
- `.github/CODEOWNERS` — Add apps/newsroom, apps/reader, and packages frontend ownership.
- `infrastructure/docker/Dockerfile.node.template` — Preserve now; later use workspace-aware pruned installs and Next standalone runtime output.

**Total: 5**

## Files to CREATE — Provisional Minimum Target Manifest

The following 253-file minimum manifest is a **planning target**, not implementation authorization. It is derived from the source-specified split-app architecture, route catalogue, component catalogue, state stores, tooling, and testing requirements. It intentionally uses `apps/newsroom` and `apps/reader`, not unapproved `apps/web`.

Paths for reader core/story/personalization and unmatched canonical UI screens are deliberately not fabricated; those phases remain at zero until route decisions are approved. Component story/test matrices will be expanded in each approved implementation card; generated API files must come from approved contracts, not handwritten assumptions.

### Phase 1 — Foundation (109 files)

- [ ] `package.json`
- [ ] `pnpm-lock.yaml`
- [ ] `.npmrc`
- [ ] `eslint.config.mjs`
- [ ] `prettier.config.mjs`
- [ ] `vitest.workspace.ts`
- [ ] `playwright.config.ts`
- [ ] `lighthouserc.cjs`
- [ ] `.env.example`
- [ ] `.github/workflows/ci-frontend.yml`
- [ ] `.github/workflows/visual-regression.yml`
- [ ] `tools/storybook/package.json`
- [ ] `tools/storybook/main.ts`
- [ ] `tools/storybook/preview.ts`
- [ ] `packages/config/package.json`
- [ ] `packages/config/eslint/base.mjs`
- [ ] `packages/config/eslint/next.mjs`
- [ ] `packages/config/eslint/react.mjs`
- [ ] `packages/config/typescript/base.json`
- [ ] `packages/config/typescript/nextjs.json`
- [ ] `packages/config/typescript/react-library.json`
- [ ] `packages/config/prettier/index.mjs`
- [ ] `packages/utils/package.json`
- [ ] `packages/utils/tsconfig.json`
- [ ] `packages/utils/src/index.ts`
- [ ] `packages/utils/src/auth/permissions.ts`
- [ ] `packages/utils/src/format/date.ts`
- [ ] `packages/utils/src/format/number.ts`
- [ ] `packages/utils/src/validation/env.ts`
- [ ] `packages/utils/src/testing/render.tsx`
- [ ] `packages/api-client/package.json`
- [ ] `packages/api-client/tsconfig.json`
- [ ] `packages/api-client/src/index.ts`
- [ ] `packages/api-client/src/client/http-client.ts`
- [ ] `packages/api-client/src/client/api-error.ts`
- [ ] `packages/api-client/src/schemas/common.ts`
- [ ] `packages/api-client/src/gen/index.ts`
- [ ] `packages/api-client/src/hooks/index.ts`
- [ ] `packages/api-client/src/hooks/query-keys.ts`
- [ ] `packages/api-client/src/testing/handlers.ts`
- [ ] `packages/ui/package.json`
- [ ] `packages/ui/tsconfig.json`
- [ ] `packages/ui/tailwind.config.ts`
- [ ] `packages/ui/postcss.config.mjs`
- [ ] `packages/ui/src/index.ts`
- [ ] `packages/ui/src/styles/globals.css`
- [ ] `packages/ui/src/tokens/colors.ts`
- [ ] `packages/ui/src/tokens/typography.ts`
- [ ] `packages/ui/src/tokens/spacing.ts`
- [ ] `packages/ui/src/tokens/motion.ts`
- [ ] `packages/ui/src/tokens/index.ts`
- [ ] `packages/ui/src/utils/cn.ts`
- [ ] `packages/ui/src/utils/focus.ts`
- [ ] `packages/ui/src/hooks/use-media-query.ts`
- [ ] `packages/ui/src/components/index.ts`
- [ ] `apps/newsroom/package.json`
- [ ] `apps/newsroom/tsconfig.json`
- [ ] `apps/newsroom/next.config.ts`
- [ ] `apps/newsroom/tailwind.config.ts`
- [ ] `apps/newsroom/postcss.config.mjs`
- [ ] `apps/newsroom/instrumentation.ts`
- [ ] `apps/newsroom/middleware.ts`
- [ ] `apps/newsroom/app/layout.tsx`
- [ ] `apps/newsroom/app/loading.tsx`
- [ ] `apps/newsroom/app/error.tsx`
- [ ] `apps/newsroom/app/global-error.tsx`
- [ ] `apps/newsroom/app/not-found.tsx`
- [ ] `apps/newsroom/app/globals.css`
- [ ] `apps/newsroom/app/manifest.ts`
- [ ] `apps/newsroom/app/providers.tsx`
- [ ] `apps/newsroom/components/shell/sidebar.tsx`
- [ ] `apps/newsroom/components/shell/topbar.tsx`
- [ ] `apps/newsroom/components/shell/status-bar.tsx`
- [ ] `apps/newsroom/components/shell/command-palette.tsx`
- [ ] `apps/newsroom/components/shell/index.ts`
- [ ] `apps/reader/package.json`
- [ ] `apps/reader/tsconfig.json`
- [ ] `apps/reader/next.config.ts`
- [ ] `apps/reader/tailwind.config.ts`
- [ ] `apps/reader/postcss.config.mjs`
- [ ] `apps/reader/instrumentation.ts`
- [ ] `apps/reader/app/layout.tsx`
- [ ] `apps/reader/app/loading.tsx`
- [ ] `apps/reader/app/error.tsx`
- [ ] `apps/reader/app/not-found.tsx`
- [ ] `apps/reader/app/globals.css`
- [ ] `apps/reader/app/manifest.ts`
- [ ] `apps/reader/app/providers.tsx`
- [ ] `apps/newsroom/hooks/use-websocket.ts`
- [ ] `apps/newsroom/hooks/use-sse.ts`
- [ ] `apps/newsroom/hooks/use-permission.ts`
- [ ] `apps/newsroom/hooks/use-online-status.ts`
- [ ] `apps/newsroom/hooks/use-command-palette.ts`
- [ ] `apps/newsroom/stores/auth-store.ts`
- [ ] `apps/newsroom/stores/workspace-store.ts`
- [ ] `apps/newsroom/stores/ui-store.ts`
- [ ] `apps/newsroom/stores/notification-store.ts`
- [ ] `apps/newsroom/stores/offline-store.ts`
- [ ] `apps/newsroom/stores/realtime-store.ts`
- [ ] `apps/newsroom/stores/workflow-store.ts`
- [ ] `apps/newsroom/lib/env.ts`
- [ ] `apps/newsroom/lib/query-client.ts`
- [ ] `apps/newsroom/lib/auth/session.ts`
- [ ] `apps/newsroom/types/index.ts`
- [ ] `apps/newsroom/vitest.config.ts`
- [ ] `apps/newsroom/tests/setup.ts`
- [ ] `apps/reader/vitest.config.ts`
- [ ] `apps/reader/tests/setup.ts`
- [ ] `packages/ui/vitest.config.ts`

### Phase 2 — Public Experience (11 files)

- [ ] `apps/newsroom/app/page.tsx`
- [ ] `apps/newsroom/app/(auth)/layout.tsx`
- [ ] `apps/newsroom/app/(auth)/login/page.tsx`
- [ ] `apps/newsroom/app/(auth)/mfa/page.tsx`
- [ ] `apps/newsroom/app/(auth)/forgot-password/page.tsx`
- [ ] `apps/reader/app/page.tsx`
- [ ] `apps/reader/app/robots.ts`
- [ ] `apps/reader/app/sitemap.ts`
- [ ] `apps/newsroom/components/auth/login-form.tsx`
- [ ] `apps/newsroom/components/auth/mfa-form.tsx`
- [ ] `apps/newsroom/components/auth/password-recovery-form.tsx`

### Phase 3 — Reader Core (0 files)

- No file paths certified: reader feed/navigation/search route contract is absent. Approve reader information architecture and UI registry entries first.

### Phase 4 — Story Experience (0 files)

- No file paths certified: public story-detail route, metadata, media, related-story, and interaction contracts are absent.

### Phase 5 — Personalization (0 files)

- No file paths certified: personalization, preference, bookmark/follow, and recommendation screens/routes are absent.

### Phase 6 — Newsroom + Truth (32 files)

- [ ] `apps/newsroom/app/(dashboard)/layout.tsx`
- [ ] `apps/newsroom/app/(dashboard)/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/discovery/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/discovery/stories/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/discovery/stories/[storyId]/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/discovery/sources/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/discovery/sources/[sourceId]/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/discovery/breaking/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/verify/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/verify/claims/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/verify/claims/[claimId]/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/verify/evidence/page.tsx`
- [ ] `apps/newsroom/components/dashboard/newsroom-overview.tsx`
- [ ] `apps/newsroom/components/discovery/story-queue.tsx`
- [ ] `apps/newsroom/components/discovery/story-kanban.tsx`
- [ ] `apps/newsroom/components/discovery/source-list.tsx`
- [ ] `apps/newsroom/components/discovery/breaking-news-console.tsx`
- [ ] `apps/newsroom/components/verify/claim-list.tsx`
- [ ] `apps/newsroom/components/verify/evidence-viewer.tsx`
- [ ] `packages/ui/src/components/ai/confidence-indicator.tsx`
- [ ] `packages/ui/src/components/ai/fact-overlay.tsx`
- [ ] `packages/ui/src/components/ai/provenance-chain.tsx`
- [ ] `packages/ui/src/components/ai/hallucination-warning.tsx`
- [ ] `apps/newsroom/hooks/use-stories.ts`
- [ ] `apps/newsroom/hooks/use-sources.ts`
- [ ] `apps/newsroom/hooks/use-claims.ts`
- [ ] `apps/newsroom/hooks/use-evidence.ts`
- [ ] `apps/newsroom/types/story.ts`
- [ ] `apps/newsroom/types/source.ts`
- [ ] `apps/newsroom/types/claim.ts`
- [ ] `apps/newsroom/tests/integration/discovery-workflow.test.tsx`
- [ ] `apps/newsroom/tests/integration/verification-workflow.test.tsx`

### Phase 7 — Agent Workforce (14 files)

- [ ] `apps/newsroom/app/(dashboard)/admin/ai-orchestrator/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/ai-orchestrator/agents/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/ai-orchestrator/workflows/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/ai-orchestrator/prompts/page.tsx`
- [ ] `apps/newsroom/components/ai-control/agent-dashboard.tsx`
- [ ] `apps/newsroom/components/ai-control/agent-activity-timeline.tsx`
- [ ] `apps/newsroom/components/ai-control/agent-communication-graph.tsx`
- [ ] `apps/newsroom/components/ai-control/workflow-monitor.tsx`
- [ ] `apps/newsroom/components/ai-control/prompt-library.tsx`
- [ ] `apps/newsroom/components/ai-control/trust-management.tsx`
- [ ] `apps/newsroom/hooks/use-agents.ts`
- [ ] `apps/newsroom/hooks/use-workflows.ts`
- [ ] `apps/newsroom/types/agent.ts`
- [ ] `apps/newsroom/tests/integration/agent-monitoring.test.tsx`

### Phase 8 — AI Intelligence (9 files)

- [ ] `apps/newsroom/components/shell/ai-assistant-panel.tsx`
- [ ] `packages/ui/src/components/ai/agent-status.tsx`
- [ ] `packages/ui/src/components/ai/prompt-preview.tsx`
- [ ] `packages/ui/src/components/ai/token-usage.tsx`
- [ ] `packages/ui/src/components/editor/ai-suggestion-overlay.tsx`
- [ ] `apps/newsroom/hooks/use-ai-stream.ts`
- [ ] `apps/newsroom/lib/streaming/parse-ai-event.ts`
- [ ] `apps/newsroom/types/ai.ts`
- [ ] `apps/newsroom/tests/integration/ai-streaming.test.tsx`

### Phase 9 — Distribution + Business (70 files)

- [ ] `apps/newsroom/app/(dashboard)/create/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/create/editor/[articleId]/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/create/headlines/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/create/media/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/publish/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/publish/schedule/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/publish/platforms/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/analyze/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/analyze/executive/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/analyze/audience/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/analyze/revenue/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/analyze/reports/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/analyze/reports/builder/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/team/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/settings/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/billing/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/compliance/page.tsx`
- [ ] `apps/newsroom/app/(dashboard)/admin/operations/page.tsx`
- [ ] `apps/newsroom/components/create/article-editor.tsx`
- [ ] `apps/newsroom/components/create/headline-studio.tsx`
- [ ] `apps/newsroom/components/create/media-library.tsx`
- [ ] `apps/newsroom/components/publish/publishing-queue.tsx`
- [ ] `apps/newsroom/components/publish/platform-status-list.tsx`
- [ ] `apps/newsroom/components/publish/publishing-calendar.tsx`
- [ ] `apps/newsroom/components/analyze/executive-dashboard.tsx`
- [ ] `apps/newsroom/components/analyze/audience-dashboard.tsx`
- [ ] `apps/newsroom/components/analyze/revenue-dashboard.tsx`
- [ ] `apps/newsroom/components/analyze/report-builder.tsx`
- [ ] `apps/newsroom/components/admin/user-role-management.tsx`
- [ ] `apps/newsroom/components/admin/rbac-matrix.tsx`
- [ ] `apps/newsroom/components/admin/compliance-dashboard.tsx`
- [ ] `apps/newsroom/components/admin/service-health-grid.tsx`
- [ ] `packages/ui/src/components/primitives/button.tsx`
- [ ] `packages/ui/src/components/primitives/input.tsx`
- [ ] `packages/ui/src/components/primitives/badge.tsx`
- [ ] `packages/ui/src/components/primitives/avatar.tsx`
- [ ] `packages/ui/src/components/primitives/icon.tsx`
- [ ] `packages/ui/src/components/primitives/spinner.tsx`
- [ ] `packages/ui/src/components/composites/card.tsx`
- [ ] `packages/ui/src/components/composites/dialog.tsx`
- [ ] `packages/ui/src/components/composites/drawer.tsx`
- [ ] `packages/ui/src/components/composites/table.tsx`
- [ ] `packages/ui/src/components/composites/form.tsx`
- [ ] `packages/ui/src/components/composites/navigation.tsx`
- [ ] `packages/ui/src/components/data-display/chart.tsx`
- [ ] `packages/ui/src/components/data-display/timeline.tsx`
- [ ] `packages/ui/src/components/data-display/story-graph-viz.tsx`
- [ ] `packages/ui/src/components/data-display/metric-card.tsx`
- [ ] `packages/ui/src/components/data-display/heatmap.tsx`
- [ ] `packages/ui/src/components/editor/rich-text-editor.tsx`
- [ ] `packages/ui/src/components/editor/fact-highlight.tsx`
- [ ] `packages/ui/src/components/editor/source-citation.tsx`
- [ ] `packages/ui/src/components/feedback/toast.tsx`
- [ ] `packages/ui/src/components/feedback/alert.tsx`
- [ ] `packages/ui/src/components/feedback/confirm-dialog.tsx`
- [ ] `packages/ui/src/components/feedback/skeleton.tsx`
- [ ] `packages/ui/src/components/feedback/empty-state.tsx`
- [ ] `apps/newsroom/hooks/use-publishing.ts`
- [ ] `apps/newsroom/hooks/use-analytics.ts`
- [ ] `apps/newsroom/hooks/use-admin.ts`
- [ ] `apps/newsroom/types/publishing.ts`
- [ ] `apps/newsroom/types/analytics.ts`
- [ ] `apps/newsroom/types/admin.ts`
- [ ] `apps/newsroom/types/editor.ts`
- [ ] `apps/newsroom/types/report.ts`
- [ ] `apps/newsroom/tests/integration/publishing-workflow.test.tsx`
- [ ] `apps/newsroom/tests/integration/analytics-dashboard.test.tsx`
- [ ] `apps/newsroom/tests/integration/admin-rbac.test.tsx`
- [ ] `apps/newsroom/tests/integration/editor-workflow.test.tsx`

### Phase 10 — Final Certification (8 files)

- [ ] `apps/newsroom/tests/e2e/auth.spec.ts`
- [ ] `apps/newsroom/tests/e2e/breaking-news-workflow.spec.ts`
- [ ] `apps/newsroom/tests/e2e/publishing.spec.ts`
- [ ] `apps/newsroom/tests/e2e/admin-access.spec.ts`
- [ ] `apps/newsroom/tests/accessibility/routes.spec.ts`
- [ ] `apps/newsroom/tests/performance/budgets.spec.ts`
- [ ] `apps/reader/tests/e2e/public-reader.spec.ts`
- [ ] `packages/ui/src/components/primitives/button.test.tsx`

**Provisional CREATE total: 253 source-derived/supporting files.** This is not a production-code authorization and is not a claim that unresolved routes are complete.

## Dependencies

### Actual Repository State

- Installed/declared frontend dependencies: **0** (there is no package manifest or lockfile).
- Dependencies to remove now: **0**.
- “Keep” cannot be applied to package dependencies because none are declared.

### Source-Specified Dependencies to Add After Authorization

Runtime/architecture requirements found in Volumes 7–8 and 33–36:

- Next.js 15, React 19, TypeScript strict mode
- Tailwind CSS with CSS custom-property design tokens
- Zustand for client state
- TanStack Query for server state and optimistic updates
- XState for complex enterprise workflows where approved
- Auth.js/NextAuth.js v5 for session integration
- Zod for boundary validation
- TipTap/ProseMirror for rich-text editing
- Workbox and IndexedDB support for PWA/offline queues
- `@tanstack/react-virtual` for lists over 50 items
- Apache ECharts for visualization, loaded per dashboard
- LaunchDarkly SDK for feature flags
- Lucide React icons
- Sentry frontend error tracking

Development/test requirements: ESLint, Prettier, Vitest, Testing Library, MSW, Playwright, axe-core/jest-axe, Storybook, Chromatic or Percy (one must be selected), and Lighthouse CI.

Exact versions and optional vendor choices must be resolved during an authorized Foundation card; do not install from this audit alone. TanStack Query does not itself manage SSE connections “automatically,” so a reviewed transport integration is required despite source wording.

## Assets

### Keep

- None; there are no usable frontend assets.

### Replace/Delete

- Delete `assets/.gitkeep` only when approved assets are added.

### Add (Design Input Required)

- Primary/monochrome/compact logo variants
- Favicon and application icons at required sizes
- Social/Open Graph default image
- PWA maskable icons and screenshots
- Approved self-hosted font files and license records, if custom fonts are selected
- Marketing/empty-state/editorial illustrations with accessibility metadata
- ECharts theme assets/tokens

No filename or visual asset should be fabricated until brand source files, licenses, dimensions, dark/light variants, and optimization requirements are supplied.

## Backend, Database, and BFF/API Boundaries

- **Backend files touched: ZERO.** Backend implementation was ignored.
- **Database files touched: ZERO.** Database implementation was ignored.
- **Backend API contracts touched: ZERO.** Existing `api/` contracts are outside this audit and remain preserved.
- **BFF/API frontend files preserved: ZERO implementations exist.** The empty `packages/api-client/.gitkeep` is slated for deletion only when an approved generated client replaces it.
- `apps/*/app/api/`: no routes exist. Future route handlers must be justified individually; do not duplicate backend business logic in Next.js.

## Removal Plan by Phase

| Phase | Focus | Files to Delete | Files to Create | Gate / note |
|---:|---|---:|---:|---|
| 1 | Foundation | 9 | 109 | Delete all placeholders as their directories are populated; improve 5 shared configs. Requires IMP-014 authorization. |
| 2 | Public Experience | 0 | 11 | Source-specified landing/auth shell only. Registration/onboarding/workspace routes remain unresolved. |
| 3 | Reader Core | 0 | 0 | Blocked: no canonical reader-core routes/screens. |
| 4 | Story Experience | 0 | 0 | Blocked: no canonical public story route contract. |
| 5 | Personalization | 0 | 0 | Blocked: no canonical personalization contract. |
| 6 | Newsroom + Truth | 0 | 32 | Source-specified newsroom discovery and truth-engine target. |
| 7 | Agent Workforce | 0 | 14 | Source-specified AI operations/agent target. |
| 8 | AI Intelligence | 0 | 9 | Source-specified AI UI/streaming target. |
| 9 | Distribution + Business | 0 | 70 | Source-specified creation, publishing, analytics, administration, and component target. |
| 10 | Final Certification | 0 | 8 | Certification tests; per-component stories/tests must be completed under phase cards. |

## Risks and Required Decisions Before Phase 1

1. **Authorization blocker:** IMP-014/015 are not eligible or authorized.
2. **Application topology:** choose the documented `newsroom` + `reader` split or approve an ADR/FDR replacing it with `apps/web`.
3. **Route registry:** assign exact routes and audiences to all 48 UI entries; reconcile source route catalogue with generated registry.
4. **Reader scope:** define reader feed, story detail, search/navigation, personalization, account, and accessibility behavior before Phases 3–5.
5. **API readiness:** approve generated-client inputs and BFF boundaries; no client currently exists.
6. **Brand assets:** provide approved source assets/licenses; no logo/font/icon can be kept.
7. **Dependency versions:** approve exact package versions and Tailwind/ESLint integration strategy.
8. **Ownership/CI:** add app/package CODEOWNERS and frontend CI before implementation merges.
9. **Security:** resolve Auth.js integration, token storage/cookie model, CSP nonce strategy, CSRF boundary, tenant headers, and LaunchDarkly data policy.
10. **Testing matrix:** create traceability from each certified route/component to unit, integration, E2E, accessibility, visual, performance, and security checks.

## Validation Results

| Validation | Result | Notes |
|---|---|---|
| `python3 scripts/generate_registries.py --check` | PASS | Generated registries are synchronized. |
| `python3 scripts/documentation_pipeline.py` | PASS | Documentation pipeline validation passed. |
| `python3 scripts/validate_implementation_dependencies.py` | BLOCKED (pre-existing) | The tracked script does not parse on repository Python 3.11 because line 102 contains a backslash inside an f-string expression. The working copy hash matches `HEAD`; this audit did not cause or fix it. |
| `python3 governance/validators/governance_validator.py` | BLOCKED (pre-existing) | The tracked validator has the same Python 3.11 f-string parse defect at line 275. The working copy hash matches `HEAD`; this audit did not cause or fix it. |
| `git diff --check` | PASS | No patch whitespace errors. |

## Acceptance Criteria Status

| Criterion | Status | Evidence / blocker |
|---|---|---|
| Complete inventory of existing frontend files | PASS | All 9 implementation placeholders and 7 directly related configs assessed |
| Every existing frontend file quality-assessed | PASS | 16-row inventory |
| Every existing frontend file classified | PASS | 9 DELETE / 2 KEEP / 0 REPLACE / 5 IMPROVE |
| Removal plan by phase | PASS | 10-phase table |
| No frontend code modifications | PASS | Report-only change; no implementation file changed |
| Backend/database untouched | PASS | Zero touched |
| Requested feature branch | BLOCKED | Arena session branch is fixed |
| PR to `develop` | BLOCKED | `develop` does not exist on origin |
| Complete certified new-file list for all phases | BLOCKED | Reader/story/personalization and unmatched UI routes are unspecified; 253-file provisional minimum supplied |
| Frontend implementation authorization | BLOCKED | IMP-014/015 not authorized |

## Phase 0 Status

**AUDIT CERTIFIED COMPLETE FOR THE REPOSITORY STATE INSPECTED.**

**HANDOFF TO PHASE 1: BLOCKED** until the governance authorization, application topology, route-registry, reader-scope, API, brand, ownership, and dependency decisions above are approved. Calling Phase 0 “fully complete” without recording those blockers would fabricate certainty that the repository does not provide.

No backend, database, API contract, or frontend implementation file was changed.
