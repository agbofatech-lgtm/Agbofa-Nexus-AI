# Phase 1 → Phase 2 Preservation / Change Map

**Product:** Agbofa Nexus AI
**Authority:** Phase 1 Cinematic Frontend Redesign — Master Frontend Implementation Contract v2.0
**Date:** 18 August 2026
**Scope:** Frontend only

## Baseline incident and Owner decision

The previously reported Phase 2 working tree at:

```text
/home/user/Agbofa-Nexus-AI-phase2
```

was not present when Phase 1 implementation began. The original forensic checkout remained at `9ee0483f7fe38638226e3fbec56a0d9857ca298d` with unrelated tracked and untracked changes and was not altered.

Implementation stopped before reconstruction. The Owner then explicitly selected **Authorize a clean rebuild**, waiving exact line-for-line preservation of the unavailable uncommitted Phase 2 files and authorizing reconstruction from the safe remote baseline:

```text
66100f94b0dcd41ee539336ae9387ee0ef1b760c
```

A clean checkout of the fixed Arena branch was reconstructed. Its branch, HEAD, and clean status were verified before modification.

Because the Phase 2 diff was unavailable, this map records concept-level preservation against the previously established Phase 2 inventory. It does **not** claim that the missing uncommitted implementation was recovered byte-for-byte.

## Preservation and change map

| Reported Phase 2 material | Phase 1 disposition | Evidence in Phase 1 working tree |
|---|---|---|
| `apps/web/app/globals.css` foundation expansion | **Rebuilt and extended** | Added surface, spacing, radius, shadow, blur, motion, layer, layout, and typography variables. Removed the render-blocking external Google Fonts import in favor of local-first stacks. |
| `apps/web/styles/tokens/foundations.ts` | **Recreated** | Typed spacing, radii, shadows, blur, motion, layer, and breakpoint tokens. |
| `apps/web/styles/tokens/typography.ts` | **Rebuilt** | Responsive display, heading, body, caption, and long-form editorial scales. |
| `apps/web/tailwind.config.ts` | **Extended** | Mapped controlled brand colors, surface levels, muted text, radii, shadows, typography, and motion durations. |
| `apps/web/components/shared/layout/Header.tsx` | **Refactored, useful behavior preserved** | Search, keyboard shortcut, theme toggle, notifications, user menu, and sign-out remain. Added primary workspace navigation, accessible popover metadata, functioning Profile/Settings routes, and explicit demo/local authority language. |
| Phase 2 public/landing refinements | **Reframed under Phase 1 authority** | Brand/tagline and Media Intelligence Operating System positioning now lead. Removed misleading “LIVE”, 32-agent, and unqualified confidence claims. Preserved restrained cinematic topology and capability storytelling. |
| Phase 2 Reader refinements | **Preserved and extended** | Existing feed, personalization, filtering, loading, empty, error, and story navigation remain. Added stronger editorial hierarchy, demo-corpus authority language, and repaired Component → Hook → Service → Mock source-filter flow. |
| Phase 2 Story refinements | **Preserved and extended** | Existing story detail, evidence, entity, related-story, and share experiences remain. Added stronger long-form typography, reading width, section rhythm, and restrained evidence-panel hierarchy. |
| Phase 2 Truth refinements | **Preserved and extended** | Existing claims/evidence interactions remain. Added investigation-first split layout, sticky claim context, stronger readable detail surfaces, and explicit “verified demo claims” language. |
| Phase 2 Newsroom refinements | **Preserved and extended** | Existing command, origination, factory, review, loading, empty, and error experiences remain. “Systems live” and “Live operations” were replaced with truthful demo labels. |
| Phase 2 Agents refinements | **Preserved and extended** | Existing registry, categories, detail, telemetry, dependency, loading, empty, and error states remain. Contextual navigation preserves all agent routes and the canonical 28-agent statement. |
| Phase 2 Intelligence refinements | **Preserved and extended** | Existing AI Control, predictive, personalization intelligence, multimodal, and cost views remain. Shared Phase 1 hierarchy standardizes headers, panels, metrics, controls, and data-boundary presentation. |
| Phase 2 Business refinements | **Preserved and extended** | Distribution, growth, analytics, monetization, AI cost, and administration remain. Existing demo-state adapters and honest integration-required actions are preserved. |
| Phase 2 responsive/touch work | **Rebuilt and extended** | Hybrid top/context/sidebar navigation and authenticated mobile bottom navigation added. Static CSS covers 320px through 1920px+, 44px mobile targets, safe-area padding, overflow containment, and reduced motion. Rendered viewport certification remains blocked. |
| Phase 2 report | **Unavailable; not reconstructed as evidence** | Replaced by a Phase 1 implementation report that explicitly records this baseline incident and the Owner waiver. |

## Phase 1 structural additions

1. **Hybrid navigation**
   - primary top navigation;
   - active-workspace contextual sidebar;
   - authenticated mobile bottom navigation;
   - reduced persona-agnostic sidebar density;
   - all pre-existing routes retained.

2. **Visible data authority**
   - persistent workspace context strip;
   - dashboard authority line;
   - demo corpus and demo event labels;
   - no live/provider/production claims for local fixtures.

3. **Command overview boundary repair**

```text
Local mock fixture
→ command service adapter
→ useCommandOverview hook
→ dashboard component
```

4. **Reader source boundary repair**

```text
Story mock module
→ reader service adapter
→ useReaderSources hook
→ FeedFilters component
```

5. **Authentication UX (frontend only)**
   - browser-local demo session language;
   - session-expired presentation;
   - unauthorized/forbidden presentation retained;
   - working Profile and Settings presentation routes;
   - explicit statement that roles are UX only and not a security boundary.

6. **Landmark repair**
   - the authenticated shell remains the single `main` landmark;
   - nested feature `<main>` elements were changed to neutral containers.

## Protected boundaries

No Phase 1 change is authorized or present in:

- Go services;
- BFF;
- databases or migrations;
- RLS;
- JWT/token implementation;
- OAuth;
- social credentials;
- AI provider credentials or calls;
- protobuf/gRPC contracts;
- backend RBAC or tenant isolation;
- production deployment.

## Certification boundary

This map is a source and governance artifact. It is not browser-rendered visual certification.

```text
NO SCREENSHOT + NO BROWSER RENDER = NO VISUAL PASS
```
