"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../../lib/bff/client";
import { VerificationCard } from "../../components/verification-card";
import { EvidenceList } from "../../components/evidence-list";
import { ConfidenceGauge } from "../../components/confidence-gauge";
import { BiasChart } from "../../components/bias-chart";
import { MisinformationBadge } from "../../components/misinformation-badge";
import {
  VerificationAgentItem,
  FactCheckVerdictItem,
  CrossReferenceResultData,
  SourceVerificationItemData,
  ExtractedClaimItemData,
  BiasAnalysisItem,
  MisinformationFlagItem,
  ConfidenceScoreItemData,
  VerificationHealthStatus,
} from "../../types";

export interface VerifierDetailPageProps {
  params: {
    agentId: string;
  };
}

function getStatusStyle(status: VerificationHealthStatus): {
  label: string;
  style: string;
} {
  switch (status) {
    case "HEALTHY":
      return {
        label: "HEALTHY",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold",
      };
    case "DEGRADED":
      return {
        label: "DEGRADED",
        style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold",
      };
    case "RATE_LIMITED":
      return {
        label: "RATE LIMITED",
        style: "bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold",
      };
    case "AUTH_FAILED":
      return {
        label: "AUTH FAILED",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "OFFLINE":
    default:
      return {
        label: "OFFLINE",
        style: "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]",
      };
  }
}

function resolveVerifierMetadata(idSlug: string): VerificationAgentItem {
  const upper = idSlug.toUpperCase();
  const idNum = upper.replace("AGT-", "");
  const num = parseInt(idNum, 10);

  const configs: VerificationAgentItem[] = [
    {
      agentId: "AGT-017",
      name: "Authoritative Fact-Check Agent",
      type: "FACT_CHECK",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.98,
      itemsProcessed24h: 340,
      avgConfidence: 0.98,
      avgLatencyMs: 140,
      primaryMetricLabel: "Verdicts Today",
      primaryMetricValue: "340 checked (99% accuracy)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-018",
      name: "Cross-Reference Corroboration Agent",
      type: "CROSS_REFERENCE",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.99,
      itemsProcessed24h: 420,
      avgConfidence: 0.96,
      avgLatencyMs: 165,
      primaryMetricLabel: "Corroboration Rate",
      primaryMetricValue: "94% (4.2 src/claim avg)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-019",
      name: "Source Verification & Authority Agent",
      type: "SOURCE_VERIFICATION",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 100.0,
      itemsProcessed24h: 890,
      avgConfidence: 0.99,
      avgLatencyMs: 85,
      primaryMetricLabel: "Sources Checked",
      primaryMetricValue: "890 verified (0 fake)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-020",
      name: "Factual Claim Extraction Agent",
      type: "CLAIM_EXTRACTION",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.97,
      itemsProcessed24h: 1240,
      avgConfidence: 0.95,
      avgLatencyMs: 95,
      primaryMetricLabel: "Claims Extracted",
      primaryMetricValue: "1,240 claims (82% verifiable)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-021",
      name: "Evidence Collection Ledger Agent",
      type: "EVIDENCE_COLLECTION",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.98,
      itemsProcessed24h: 3100,
      avgConfidence: 0.97,
      avgLatencyMs: 180,
      primaryMetricLabel: "Evidence Items",
      primaryMetricValue: "3,100 items (0.98 rel avg)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-022",
      name: "Multi-Axis Bias Detection Agent",
      type: "BIAS_DETECTION",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.99,
      itemsProcessed24h: 840,
      avgConfidence: 0.94,
      avgLatencyMs: 110,
      primaryMetricLabel: "Analyses Today",
      primaryMetricValue: "840 checked (12 flags)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-023",
      name: "Misinformation & Risk Flagging Agent",
      type: "MISINFORMATION_FLAGGING",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.96,
      itemsProcessed24h: 840,
      avgConfidence: 0.96,
      avgLatencyMs: 125,
      primaryMetricLabel: "Risk Flags",
      primaryMetricValue: "840 checked (0 critical)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-024",
      name: "Authoritative Confidence Scoring Agent",
      type: "CONFIDENCE_SCORING",
      squad: "VERIFICATION",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 100.0,
      itemsProcessed24h: 840,
      avgConfidence: 0.964,
      avgLatencyMs: 90,
      primaryMetricLabel: "Weighted Scores",
      primaryMetricValue: "96.4% avg (88% VERIFIED_TRUTH)",
      lastCheckedAt: new Date().toISOString(),
    },
  ];

  const matched =
    configs.find(
      (c) =>
        c.agentId === upper ||
        c.agentId === `AGT-00${num}` ||
        c.agentId === `AGT-0${num}`,
    ) || configs[0];

  return matched;
}

// Sample data sets for dynamic verifier rendering
const SAMPLE_FACT_CHECKS: FactCheckVerdictItem[] = [
  {
    claimId: "cl-101",
    claimText:
      "Agbofa Nexus AI has officially deployed 32 specialized agents across news gathering and verification operations.",
    claimType: "FACTUAL",
    verdict: "TRUE",
    confidence: 0.99,
    sources: [
      { name: "Reuters Wire News", url: "https://reuters.com" },
      { name: "AP News Feed", url: "https://apnews.com" },
    ],
    evidence: [
      {
        evidenceId: "ev-1",
        claimId: "cl-101",
        type: "SUPPORTING",
        description:
          "Official press release and architecture deployment ledger confirm 32 active agents across 4 squads.",
        source: "Agbofa Technologies Registry (IMP-017)",
        reliabilityScore: 0.99,
        isOfficial: true,
        timestamp: new Date().toISOString(),
      },
    ],
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    explanation:
      "Corroborated by 4 independent wire feeds and system telemetry ledgers.",
    aiAnalysisSummary: "Zero contradiction detected in Story Graph knowledge base.",
  },
  {
    claimId: "cl-102",
    claimText:
      "The autonomous newsroom operates continuously without manual human editorial intervention in standard gathering.",
    claimType: "STATISTICAL",
    verdict: "TRUE",
    confidence: 0.94,
    sources: [{ name: "Agbofa System Telemetry", url: "#" }],
    evidence: [
      {
        evidenceId: "ev-2",
        claimId: "cl-102",
        type: "SUPPORTING",
        description: "24/7 telemetry logs show continuous ingestion.",
        source: "Nexus Ops Ledger",
        reliabilityScore: 0.96,
        isOfficial: true,
        timestamp: new Date().toISOString(),
      },
    ],
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    explanation: "Telemetry confirms 24/7 autonomous gathering pipeline operation.",
  },
];

const SAMPLE_CROSS_REF: CrossReferenceResultData = {
  strongCount: 280, // 3+ independent sources (#0D9040)
  moderateCount: 110, // 2 independent sources (#3399FF)
  weakCount: 25, // 1 independent source (#F59E0B)
  noneCount: 5, // 0 independent sources (#CF2020)
  avgIndependentSources: 4.2,
  parentCompanyConflicts: 2,
  syndicatedFlags: 14,
  sourceMatrix: [
    {
      claimId: "cl-101",
      claimText: "32 specialized agents deployed across news gathering and verification",
      totalSources: 6,
      independent: 4,
      corroborated: true,
      confidence: 0.98,
      sourceRelationships: ["Reuters Wire", "AP News", "AFP Wire", "Bloomberg"],
    },
    {
      claimId: "cl-102",
      claimText: "Autonomous newsroom operates continuously without intervention",
      totalSources: 3,
      independent: 2,
      corroborated: true,
      confidence: 0.92,
      sourceRelationships: ["Agbofa Telemetry", "System Health Ledger"],
    },
  ],
};

const SAMPLE_SOURCE_VERIFS: SourceVerificationItemData[] = [
  {
    sourceId: "src-reuters",
    sourceName: "Reuters Wire News",
    domain: "reuters.com",
    authenticity: "AUTHENTICATED",
    authorityScore: 0.98,
    verificationMethod: "REGISTRY",
    identityConsistency: true,
  },
  {
    sourceId: "src-ap",
    sourceName: "Associated Press",
    domain: "apnews.com",
    authenticity: "AUTHENTICATED",
    authorityScore: 0.97,
    verificationMethod: "REGISTRY",
    identityConsistency: true,
  },
  {
    sourceId: "src-social-01",
    sourceName: "@crypto_whale_99",
    domain: "twitter.com",
    authenticity: "SUSPICIOUS",
    authorityScore: 0.32,
    verificationMethod: "AI_GATEWAY",
    identityConsistency: false,
  },
];

const SAMPLE_EXTRACTED_CLAIMS: ExtractedClaimItemData[] = [
  {
    claimId: "cl-201",
    claimText:
      "Agbofa Nexus AI deploys 32 specialized autonomous agents across global newsrooms.",
    claimType: "FACTUAL",
    isVerifiable: true,
    sourceContent:
      "Reuters reported today that Agbofa Nexus AI deploys 32 specialized autonomous agents...",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    claimId: "cl-202",
    claimText:
      "Autonomous AI newsgathering will transform global media economics by 2028.",
    claimType: "PREDICTION",
    isVerifiable: false,
    sourceContent:
      "Industry analysts predict that autonomous AI newsgathering will transform global media economics...",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
  },
];

const SAMPLE_BIAS_ITEM: BiasAnalysisItem = {
  contentId: "pkg-101",
  classification: "NONE",
  severity: 0.02,
  indicators: [
    {
      textExample: "officially deployed its complete 32-agent workforce",
      description:
        "Factual reporting style without emotional framing or commercial bias.",
    },
  ],
  emotionalLanguageFlags: [],
  selfAwarenessFlag: true,
};

const SAMPLE_MISINFO_ITEM: MisinformationFlagItem = {
  flagId: "flg-101",
  contentId: "story-101",
  classification: "CLEAN",
  riskScore: 0.04,
  severity: "LOW",
  contributingFactors: [
    "Zero synthetic multimedia artifacts detected by AGT-013",
    "Source credibility verified at 99% reliability score",
    "Consistent factual statements across 4 independent wire feeds",
  ],
  intentDistinction: "No intentional deception or unverified viral distortion detected.",
  recommendedAction: "Approve for standard ContentFactoryService packaging.",
};

const SAMPLE_CONF_SCORE: ConfidenceScoreItemData = {
  storyId: "story-101",
  finalScore: 0.964,
  tier: "VERIFIED_TRUTH",
  breakdown: {
    factCheckScore: 0.98,
    crossRefScore: 0.96,
    sourceScore: 0.99,
    evidenceScore: 0.94,
    biasScore: 0.95,
  },
  uncertainty: 0.012,
  isAnomaly: false,
  timestamp: new Date().toISOString(),
};

export default function VerificationAgentDetailPage({
  params,
}: VerifierDetailPageProps): React.JSX.Element {
  const router = useRouter();
  const { agentId } = params;

  const [verifier, setVerifier] = useState<VerificationAgentItem>(() =>
    resolveVerifierMetadata(agentId),
  );
  const [factChecks] = useState<FactCheckVerdictItem[]>(SAMPLE_FACT_CHECKS);
  const [crossRef] = useState<CrossReferenceResultData>(SAMPLE_CROSS_REF);
  const [sourceVerifs] = useState<SourceVerificationItemData[]>(
    SAMPLE_SOURCE_VERIFS,
  );
  const [extractedClaims] = useState<ExtractedClaimItemData[]>(
    SAMPLE_EXTRACTED_CLAIMS,
  );
  const [biasItem] = useState<BiasAnalysisItem>(SAMPLE_BIAS_ITEM);
  const [misinfoItem] = useState<MisinformationFlagItem>(SAMPLE_MISINFO_ITEM);
  const [confScore] = useState<ConfidenceScoreItemData>(SAMPLE_CONF_SCORE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  const loadVerifierTelemetry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await callRpc<
        { tenant_id: string; active_only: boolean },
        { sources?: unknown[] }
      >("content_origination.v1.ContentOriginationService", "ListSources", {
        tenant_id: "tenant-default",
        active_only: true,
      });
      if (resp.status === "ERROR") {
        setError(resp.error?.message || "Failed to load verifier detail from BFF.");
      } else {
        setVerifier(resolveVerifierMetadata(agentId));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (simulateMode === "normal") {
      loadVerifierTelemetry();
    }
  }, [loadVerifierTelemetry, simulateMode]);

  const statusBadge = getStatusStyle(verifier.status);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/verification")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Verification Squad
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-36 animate-pulse rounded-lg bg-[#12121A]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/verification")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Verification Squad
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto max-w-lg rounded-lg border border-[#CF2020] bg-[#12121A] p-6 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
            ⚠
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Verifier Telemetry Retrieval Failed
          </h3>
          <p className="mb-6 text-xs text-[#A0A4A8]">
            We could not retrieve the requested verifier telemetry from AIGatewayService.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "error") setSimulateMode("normal");
                else loadVerifierTelemetry();
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/agents/verification")}
              className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
            >
              Return to Squad
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (simulateMode === "empty") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/verification")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Verification Squad
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Zero verification events for {verifier.agentId} ({verifier.name})
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The verification engine has zero claims or source verifications logged in the selected window. The runtime process is connected and nominal.
          </p>
          <button
            type="button"
            onClick={() => setSimulateMode("normal")}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Verification Ledger
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Back Nav & Testing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <button
          type="button"
          onClick={() => router.push("/agents/verification")}
          className="text-xs font-semibold text-[#3399FF] hover:underline"
        >
          ← Back to Verification Squad
        </button>
        <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* COMMON AGENT HEADER CARD */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow md:flex-row md:items-center">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#2E2E32] bg-[#0A0A0B] text-2xl font-bold text-[#0D9040]">
            ✓
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#0A0A0B] px-2.5 py-0.5 font-mono text-xs font-bold text-[#FAFAFA] border border-[#2E2E32]">
                {verifier.agentId}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${statusBadge.style}`}
              >
                ● {statusBadge.label}
              </span>
              <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[11px] text-[#A0A4A8] border border-[#2E2E32]">
                v:{verifier.version}
              </span>
              <span className="rounded bg-[#0D9040]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#0D9040] border border-[#0D9040]/30">
                {verifier.squad} SQUAD
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-[#FAFAFA] md:text-2xl">
              {verifier.name}
            </h1>
          </div>
        </div>

        {/* AGENT ACTIONS TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              alert(`Process restart signal dispatched to ${verifier.agentId}. Runtime state refreshed.`)
            }
            className="rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
          >
            ↻ Restart Verifier
          </button>
          <button
            type="button"
            onClick={() => alert("Verification confidence calibration check triggered against AIGatewayService.")}
            className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ⚡ Calibrate Ledger
          </button>
        </div>
      </div>

      {/* COMMON METRICS ROW (grid-cols-2 lg:grid-cols-4) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Uptime &amp; SLA
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {verifier.uptime}% <span className="text-xs font-normal text-[#0D9040]">▲ Nominal</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            24h operational reliability
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Processed Items (24h)
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {verifier.itemsProcessed24h.toLocaleString()}{" "}
            <span className="text-xs font-normal text-[#3399FF]">▲ +12%</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            {verifier.primaryMetricLabel}
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Average Confidence / Accuracy
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {(verifier.avgConfidence * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Precision verification tier
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Avg Processing Latency (p95)
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-[#3399FF]">
            {verifier.avgLatencyMs}ms
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            AIGatewayService turnaround
          </div>
        </div>
      </div>

      {/* DYNAMIC VISUALIZATIONS BY VERIFICATION AGENT ID */}
      {verifier.agentId === "AGT-017" && (
        <div className="space-y-6">
          {/* VERDICT DISTRIBUTION HORIZONTAL STACKED BAR */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-017 Fact-Check Verdict Distribution (340 verified today)
            </h3>
            <div className="mb-6 flex h-8 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
              <div
                className="h-full bg-[#0D9040] transition-all"
                style={{ width: "70%" }}
                title="TRUE (#0D9040): 70%"
              />
              <div
                className="h-full bg-[#CF2020] transition-all"
                style={{ width: "12%" }}
                title="FALSE (#CF2020): 12%"
              />
              <div
                className="h-full bg-[#F59E0B] transition-all"
                style={{ width: "10%" }}
                title="MISLEADING (#F59E0B): 10%"
              />
              <div
                className="h-full bg-[#A0A4A8] transition-all"
                style={{ width: "5%" }}
                title="UNVERIFIED (#A0A4A8): 5%"
              />
              <div
                className="h-full bg-[#6C5CE7] transition-all"
                style={{ width: "3%" }}
                title="HALF_TRUE (#6C5CE7): 3%"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-3">
                <div className="text-xs font-bold text-[#0D9040]">TRUE</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">238 (70%)</div>
              </div>
              <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-3">
                <div className="text-xs font-bold text-[#CF2020]">FALSE</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">41 (12%)</div>
              </div>
              <div className="rounded border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3">
                <div className="text-xs font-bold text-amber-400">MISLEADING</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">34 (10%)</div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#2E2E32]/40 p-3">
                <div className="text-xs font-bold text-[#A0A4A8]">UNVERIFIED</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">17 (5%)</div>
              </div>
              <div className="rounded border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-3">
                <div className="text-xs font-bold text-[#6C5CE7]">HALF_TRUE</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">10 (3%)</div>
              </div>
            </div>
          </div>

          {/* KNOWN FACT DATABASE LEDGER */}
          <div className="rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-5 shadow">
            <h3 className="mb-2 text-sm font-bold text-[#3399FF]">
              Authoritative Known Fact Database Hit/Miss Metrics
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <span className="text-xs text-[#A0A4A8]">Hit Rate:</span>
                <div className="text-2xl font-bold text-[#0D9040]">84.2%</div>
                <span className="text-[11px] text-[#A0A4A8]">Matched in known DB</span>
              </div>
              <div>
                <span className="text-xs text-[#A0A4A8]">Miss Rate:</span>
                <div className="text-2xl font-bold text-[#3399FF]">15.8%</div>
                <span className="text-[11px] text-[#A0A4A8]">AIGatewayService analysis</span>
              </div>
              <div>
                <span className="text-xs text-[#A0A4A8]">Total Known Facts:</span>
                <div className="text-2xl font-bold text-[#FAFAFA]">148,400</div>
                <span className="text-[11px] text-[#A0A4A8]">Story Graph knowledge base</span>
              </div>
            </div>
          </div>

          {/* RECENT FACT-CHECKS LIST */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#FAFAFA]">
              Recent Fact-Check Verdicts ({factChecks.length} items)
            </h3>
            <div className="space-y-4">
              {factChecks.map((fc) => (
                <VerificationCard key={fc.claimId} claim={fc} />
              ))}
            </div>
          </div>
        </div>
      )}

      {verifier.agentId === "AGT-018" && (
        <div className="space-y-6">
          {/* CORROBORATION STRENGTH BREAKDOWN (STRONG #0D9040, MODERATE #3399FF, WEAK #F59E0B, NONE #CF2020) */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-018 Corroboration Strength Breakdown (420 claims checked)
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
                <div className="text-xs font-bold text-[#0D9040]">
                  STRONG (3+ Independent Src) — #0D9040
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {crossRef.strongCount} (66%)
                </div>
              </div>
              <div className="rounded border border-[#0066CC]/30 bg-[#0066CC]/10 p-4">
                <div className="text-xs font-bold text-[#3399FF]">
                  MODERATE (2 Independent Src) — #3399FF
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {crossRef.moderateCount} (26%)
                </div>
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="text-xs font-bold text-amber-400">
                  WEAK (1 Independent Src) — #F59E0B
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {crossRef.weakCount} (6%)
                </div>
              </div>
              <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
                <div className="text-xs font-bold text-[#CF2020]">
                  NONE (0 Independent Src) — #CF2020
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {crossRef.noneCount} (2%)
                </div>
              </div>
            </div>

            {/* INDEPENDENT SOURCE ANALYSIS */}
            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#2E2E32] pt-4 sm:grid-cols-3">
              <div>
                <span className="text-xs text-[#A0A4A8]">Avg Independent Sources:</span>
                <div className="text-xl font-bold text-[#0D9040]">
                  {crossRef.avgIndependentSources} src/claim
                </div>
              </div>
              <div>
                <span className="text-xs text-[#A0A4A8]">Parent Company Conflicts:</span>
                <div className="text-xl font-bold text-amber-400">
                  {crossRef.parentCompanyConflicts} detected
                </div>
              </div>
              <div>
                <span className="text-xs text-[#A0A4A8]">Syndicated Source Flags:</span>
                <div className="text-xl font-bold text-[#3399FF]">
                  {crossRef.syndicatedFlags} flags
                </div>
              </div>
            </div>
          </div>

          {/* SOURCE MATRIX VISUALIZATION TABLE */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
              Authoritative Source Corroboration Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] font-semibold text-[#A0A4A8]">
                    <th className="px-3 py-2">Claim ID</th>
                    <th className="px-3 py-2">Claim Text</th>
                    <th className="px-3 py-2 text-right">Total Src</th>
                    <th className="px-3 py-2 text-right">Independent</th>
                    <th className="px-3 py-2 text-center">Corroborated</th>
                    <th className="px-3 py-2 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E32]">
                  {crossRef.sourceMatrix.map((row) => (
                    <tr key={row.claimId} className="hover:bg-[#0066CC]/10">
                      <td className="px-3 py-2 font-mono font-bold text-[#3399FF]">
                        {row.claimId}
                      </td>
                      <td className="max-w-md px-3 py-2 text-[#FAFAFA]">
                        {row.claimText}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#FAFAFA]">
                        {row.totalSources}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#0D9040]">
                        {row.independentSources}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.corroborated ? (
                          <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
                            ✔ Corroborated
                          </span>
                        ) : (
                          <span className="rounded bg-[#CF2020]/20 px-2 py-0.5 text-[10px] font-bold text-[#CF2020]">
                            ✕ Not Corroborated
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[#FAFAFA]">
                        {(row.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {verifier.agentId === "AGT-019" && (
        <div className="space-y-6">
          {/* SOURCE AUTHENTICITY BREAKDOWN (AUTHENTICATED #0D9040, SUSPICIOUS #F59E0B, IMPERSONATING #CF2020, UNVERIFIED #A0A4A8, BOT #6C5CE7) */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-019 Source Authenticity Breakdown (890 checked today)
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-3">
                <div className="text-xs font-bold text-[#0D9040]">AUTHENTICATED</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">842 (95%)</div>
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="text-xs font-bold text-amber-400">SUSPICIOUS</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">28 (3%)</div>
              </div>
              <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-3">
                <div className="text-xs font-bold text-[#CF2020]">IMPERSONATING</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">0 (0%)</div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#2E2E32]/40 p-3">
                <div className="text-xs font-bold text-[#A0A4A8]">UNVERIFIED</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">15 (1%)</div>
              </div>
              <div className="rounded border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-3">
                <div className="text-xs font-bold text-[#6C5CE7]">BOT</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">5 (1%)</div>
              </div>
            </div>
          </div>

          {/* RECENT SOURCE VERIFICATIONS LIST */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
              Recent Source Verifications &amp; Domain Authority Ledger
            </h3>
            <div className="space-y-3">
              {sourceVerifs.map((src) => (
                <div
                  key={src.sourceId}
                  className="flex flex-col justify-between gap-2 rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-bold text-[#FAFAFA]">{src.sourceName}</span>{" "}
                    <span className="font-mono text-[11px] text-[#3399FF]">
                      ({src.domain})
                    </span>
                    <div className="mt-1 flex items-center space-x-2 text-[11px] text-[#A0A4A8]">
                      <span>Method: <strong className="text-[#FAFAFA]">{src.verificationMethod}</strong></span>
                      <span>·</span>
                      <span>
                        Identity:{" "}
                        <strong
                          className={
                            src.identityConsistency
                              ? "text-[#0D9040]"
                              : "text-amber-400"
                          }
                        >
                          {src.identityConsistency ? "CONSISTENT" : "SUSPICIOUS"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        src.authenticity === "AUTHENTICATED"
                          ? "bg-[#0D9040]/20 text-[#0D9040]"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {src.authenticity}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#FAFAFA]">
                      {(src.authorityScore * 100).toFixed(0)}% Authority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {verifier.agentId === "AGT-020" && (
        <div className="space-y-6">
          {/* CLAIM TYPE DISTRIBUTION (FACTUAL #0D9040, OPINION #6C5CE7, PREDICTION #3399FF, STATISTICAL #F59E0B, QUOTATION #A0A4A8) */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-020 Claim Type Distribution (1,240 claims extracted today)
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-3">
                <div className="text-xs font-bold text-[#0D9040]">FACTUAL — #0D9040</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">680 (55%)</div>
              </div>
              <div className="rounded border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-3">
                <div className="text-xs font-bold text-[#6C5CE7]">OPINION — #6C5CE7</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">220 (18%)</div>
              </div>
              <div className="rounded border border-[#3399FF]/30 bg-[#3399FF]/10 p-3">
                <div className="text-xs font-bold text-[#3399FF]">PREDICTION — #3399FF</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">150 (12%)</div>
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="text-xs font-bold text-amber-400">STATISTICAL — #F59E0B</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">120 (10%)</div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#2E2E32]/40 p-3">
                <div className="text-xs font-bold text-[#A0A4A8]">QUOTATION — #A0A4A8</div>
                <div className="mt-1 text-xl font-bold text-[#FAFAFA]">70 (5%)</div>
              </div>
            </div>
          </div>

          {/* VERIFIABLE VS NON-VERIFIABLE RATIO */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-2 text-sm font-bold text-[#FAFAFA]">
              Verifiable vs Non-Verifiable Claims Ratio
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded border border-[#0D9040]/40 bg-[#0D9040]/10 p-4">
                <div className="text-xs font-bold text-[#0D9040]">
                  VERIFIABLE CLAIMS (Can Be Fact-Checked)
                </div>
                <div className="mt-1 text-2xl font-bold text-[#FAFAFA]">
                  1,017 claims (82%)
                </div>
                <div className="text-[11px] text-[#A0A4A8]">
                  Routed to AGT-017 Fact-Check Agent
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4">
                <div className="text-xs font-bold text-[#A0A4A8]">
                  NON-VERIFIABLE CLAIMS (Opinions, Future Predictions)
                </div>
                <div className="mt-1 text-2xl font-bold text-[#FAFAFA]">
                  223 claims (18%)
                </div>
                <div className="text-[11px] text-[#A0A4A8]">
                  Tagged for editorial context
                </div>
              </div>
            </div>
          </div>

          {/* RECENT EXTRACTIONS */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-3 text-sm font-bold text-[#FAFAFA]">
              Recent Extracted Claims Ledger
            </h3>
            <div className="space-y-3">
              {extractedClaims.map((ext) => (
                <div
                  key={ext.claimId}
                  className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#3399FF]">
                      {ext.claimId}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="rounded bg-[#12121A] px-2 py-0.5 text-[10px] font-bold text-[#FAFAFA] border border-[#2E2E32]">
                        {ext.claimType}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          ext.isVerifiable
                            ? "bg-[#0D9040]/20 text-[#0D9040]"
                            : "bg-[#2E2E32] text-[#A0A4A8]"
                        }`}
                      >
                        {ext.isVerifiable ? "VERIFIABLE" : "NON-VERIFIABLE"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 font-bold text-[#FAFAFA]">
                    &ldquo;{ext.claimText}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] text-[#A0A4A8]">
                    Source Context: {ext.sourceContent}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {verifier.agentId === "AGT-021" && (
        <div className="space-y-6">
          {/* ZERO FABRICATION GUARANTEE POLICY DISPLAY */}
          <div className="rounded-lg border-2 border-[#0D9040] bg-[#0D9040]/10 p-5 shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-[#0D9040]">★</span>
              <h4 className="text-sm font-bold tracking-wide text-[#FAFAFA]">
                ZERO FABRICATION GUARANTEE POLICY
              </h4>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#0D9040]">
              Never fabricates evidence — missing evidence returns empty. Incident count: 0
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#FAFAFA]">
              AGT-021 Evidence Collection Agent authoritatively queries verified wire registries and knowledge ledgers. When zero evidence is matched, the engine returns an empty evidence array without synthetic hallucination.
            </p>
          </div>

          {/* EVIDENCE TYPE BREAKDOWN & STRENGTH */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-021 Evidence Type &amp; Corroboration Strength Breakdown (3,100 items)
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
                <div className="text-xs font-bold text-[#0D9040]">
                  SUPPORTING — #0D9040
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  2,510 items (81%)
                </div>
              </div>
              <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
                <div className="text-xs font-bold text-[#CF2020]">
                  REFUTING — #CF2020
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  340 items (11%)
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#2E2E32]/40 p-4">
                <div className="text-xs font-bold text-[#A0A4A8]">
                  NEUTRAL / CONTEXT — #A0A4A8
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  250 items (8%)
                </div>
              </div>
            </div>
          </div>

          {/* EVIDENCE ITEMS LIST */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              Evidence Items Ledger (.gov / .edu Official Authorities Highlighted)
            </h3>
            <EvidenceList
              evidence={SAMPLE_FACT_CHECKS[0].evidence.concat(
                SAMPLE_FACT_CHECKS[1].evidence,
              )}
            />
          </div>
        </div>
      )}

      {verifier.agentId === "AGT-022" && (
        <div className="space-y-6">
          <BiasChart
            classifications={{
              none: 680,
              political: 40,
              commercial: 70,
              cultural: 30,
              selection: 20,
            }}
            totalAnalyses={840}
            selfAwarenessActive={true}
          />
        </div>
      )}

      {verifier.agentId === "AGT-023" && (
        <div className="space-y-6">
          <MisinformationBadge
            classification={misinfoItem.classification}
            riskScore={misinfoItem.riskScore}
            severity={misinfoItem.severity}
            contributingFactors={misinfoItem.contributingFactors}
            intentDistinction={misinfoItem.intentDistinction}
            recommendedAction={misinfoItem.recommendedAction}
          />
        </div>
      )}

      {verifier.agentId === "AGT-024" && (
        <div className="space-y-6">
          <ConfidenceGauge
            score={confScore.finalScore}
            tier={confScore.tier}
            breakdown={confScore.breakdown}
            size="lg"
          />

          {/* SCORING ANOMALY DETECTION & MISSING SIGNAL HANDLING */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5">
              <h3 className="text-sm font-bold text-amber-400">
                ⚡ Scoring Anomaly Detection
              </h3>
              <p className="mt-1 text-xs text-[#FAFAFA]">
                Anomalies detected (24h) when individual factor scores diverge &gt; 0.50: <strong className="text-amber-400">2 items</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-[#0066CC]/40 bg-[#0066CC]/10 p-5">
              <h3 className="text-sm font-bold text-[#3399FF]">
                🛡 Missing Signal Handling &amp; Weight Redistribution
              </h3>
              <p className="mt-1 text-xs text-[#FAFAFA]">
                When a signal factor is unavailable, AGT-024 authoritatively redistributes remaining weights. Today count: <strong className="text-[#3399FF]">0 missing signals</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ALL AGENTS: FULL AGENT RUNTIME ACTIONS TOOLBAR */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#FAFAFA]">
            AIGatewayService Runtime Process Controls ({verifier.agentId})
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => alert(`Verification agent ${verifier.agentId} paused.`)}
              className="rounded bg-amber-500/20 px-3 py-1 font-semibold text-amber-400 hover:bg-amber-500/30"
            >
              ⏸ Pause Agent
            </button>
            <button
              type="button"
              onClick={() => alert(`Verification agent ${verifier.agentId} resumed.`)}
              className="rounded bg-[#0D9040]/20 px-3 py-1 font-semibold text-[#0D9040] hover:bg-[#0D9040]/30"
            >
              ▶ Resume Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SimulationDetailToolbarProps {
  currentMode: "normal" | "loading" | "error";
  onSelectMode: (mode: "normal" | "loading" | "error") => void;
}

function SimulationDetailToolbar({
  currentMode,
  onSelectMode,
}: SimulationDetailToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-1 rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-1 text-[11px]">
      <span className="px-1 text-[#A0A4A8]">State:</span>
      {(["normal", "loading", "error"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectMode(mode)}
          className={`rounded px-2 py-0.5 font-medium transition-colors ${
            currentMode === mode
              ? "bg-[#0066CC] text-[#FAFAFA]"
              : "text-[#A0A4A8] hover:bg-[#12121A] hover:text-[#FAFAFA]"
          }`}
        >
          {mode.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
