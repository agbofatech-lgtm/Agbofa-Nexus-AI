# Batch 2 Architecture Extraction Report

**Scope:** Volumes 11–20  
**Mode:** Extract/register only; no redesign.

## Extracted Counts

- Entities: 8
- Services/components: 62
- Databases/stores: 12
- APIs: 14
- Events: 19
- Workflows: 10
- ADRs: 50

## Major Extracted Areas

1. Foundation Platform Services / IAM / Notification references.
2. Content Origination Engine with ingestion, source management, story detection, graph initialization, state engine and Content Maestro.
3. Truth Engine with verification services, confidence scoring, editorial decisioning, provenance, audit, APIs and events.
4. Content Factory with story intelligence, generation, multimedia, platform adaptation, SEO, multilingual content, QA and human review.
5. Compliance Gatekeeper with rights, plagiarism, legal, privacy, safety, platform policy and scoring.
6. Distribution Engine with publication orchestration, connectors, scheduling, breaking news delivery, synchronization, corrections, monitoring and analytics feedback.
7. Analytics & Insights with unified analytics, real-time/batch processing, audience intelligence, recommendations, optimization, experiments and feedback events.
8. Enterprise Operations with multi-region infrastructure, service mesh, APISIX, observability, reliability, SecOps, DR, operations centre, FinOps and production readiness.

## Caveat

Volume 11 requires source-boundary verification before its extracted foundation-service references are treated as complete.
