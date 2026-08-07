# Batch 2 Terminology Audit Report

| Candidate Preferred Term | Alternative / Related Terms | Source Area | Inconsistency Type | Recommendation |
|---|---|---|---|---|
| Content Origination Engine | News Ingestion Engine; Story Detection Engine; Content Maestro | Volume 12 | Parent/child service boundary | Preserve hierarchy; do not merge. |
| Truth Engine | Verification Services; Source Verification; Claim Verification; Fact-Checking Service | Volume 13 | Domain vs internal services | Preserve Truth Engine as domain; internal services remain distinct. |
| Story Graph | Story Graph Initialization; Truth Story Graph Service; Neo4j Story Graph | Volumes 12–13 | Shared graph concept across contexts | Reconcile ownership after Volumes 27 and Phase 5. |
| Content Factory | Content Factory Services; Content Generation Pipeline; Story Intelligence Service | Volumes 14–15 | Domain/service overlap | Defer canonical mapping until Batch 3 implementation specs. |
| Compliance Gatekeeper | Compliance Gateway; Compliance Scoring Engine; AI Safety Review Service | Volume 16 | Parent/gateway/service terms | Preserve hierarchy; no redesign. |
| Distribution Engine | Publication Orchestrator; Publishing Queue System; Platform Connector Framework | Volumes 17–19 | Parent/child service boundary | Preserve hierarchy. |
| Analytics & Insights Engine | Real-Time Analytics Engine; Batch Analytics Engine; Audience Intelligence; AI Optimization | Volumes 18–19 | Parent/child analytics domains | Preserve hierarchy. |
| GitOps | ArgoCD; Flux CD | Volumes 9–10 and 20 | Technology evolution/conflict candidate | Defer to global reconciliation. |
| Service Mesh | Istio; Istio Ambient | Volumes 9–10 and 20 | Technology evolution | Defer to global reconciliation. |
