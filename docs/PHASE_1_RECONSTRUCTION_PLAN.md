# Phase 1 Reconstruction Plan — Frontend OS Foundation

**Baseline:** `dbe2a73d7e2c92d895d92fe936daf8229fed6c35`

This is a new reconstruction. It does not restore or recreate unavailable historical SHAs.

## Classification

**PRESERVE:** all 29 routes, 21 layouts, cinematic design system, Reader, Story, Newsroom, Truth, Intelligence, Agents, Distribution, Growth, Analytics, Monetization, AI Cost, AI Control, Admin, Settings, Profile, authentication UX, 28-agent registry, existing stores/services/hooks.

**EXTEND:** canonical provenance; centralized navigation; Settings control plane; responsive/reduced-motion styles.

**INTEGRATE:** feature flags with navigation; capability metadata through mock → adapter → service → hook → existing Settings UI; canonical agent count.

**BUILD:** feature/execution flags; capability/execution-reality model; Phase 2-ready Opportunity, Strategy, Decision, Approval, Forecast, Orchestration, Autonomy, Memory, Cost, and Risk contracts; future workspace manifest; reusable state/confidence/capability primitives; compile-time contract checks.

**BLOCKED:** strategy execution, autonomy, paid execution, publishing, provider routing, persistent memory, backend enforcement.

## State decision

No new Zustand store. Foundation request state remains local to `usePhase1Foundation`.

## Gates

TypeScript, ESLint, production build, static generation, 29-route validation, source-boundary audit, protected-path audit, static accessibility/responsive inspection, clean working tree, new commit, remote persistence, no Phase 2.
