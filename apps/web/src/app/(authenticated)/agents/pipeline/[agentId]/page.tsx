"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../../lib/bff/client";
import { ThroughputChart } from "../components/throughput-chart";
import { BottleneckAlert } from "../components/bottleneck-alert";
import { IngestionMetrics } from "../components/ingestion-metrics";
import { ComplianceSummary } from "../components/compliance-summary";
import { FeedbackImpact } from "../components/feedback-impact";
import {
  PipelineAgentItem,
  PipelineStageFlowItem,
  BottleneckAlertData,
  IngestionRoutingData,
  ComplianceScanData,
  FeedbackImpactData,
  StoryGraphUpdaterData,
  FactoryIntakeData,
  DistributionSchedulerData,
  AnalyticsCollectorData,
  OpsMetaAgentData,
  PipelineAgentHealthStatus,
} from "../types";

export interface PipelineDetailPageProps {
  params: {
    agentId: string;
  };
}

function getStatusStyle(status: PipelineAgentHealthStatus): {
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

function resolvePipelineMetadata(idSlug: string): PipelineAgentItem {
  const upper = idSlug.toUpperCase();
  const idNum = upper.replace("AGT-", "");
  const num = parseInt(idNum, 10);

  const configs: PipelineAgentItem[] = [
    {
      agentId: "AGT-025",
      name: "Content Ingestion Orchestrator Agent",
      type: "INGESTION_ORCHESTRATOR",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 100.0,
      itemsProcessed24h: 114850,
      avgLatencyMs: 45,
      primaryMetricLabel: "Items Routed",
      primaryMetricValue: "114,850 routed (3 tiers)",
      lastHealthCheck: new Date().toISOString(),
    },
    {
      agentId: "AGT-026",
      name: "Story Graph Updater Agent",
      type: "STORY_GRAPH_UPDATER",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.99,
      itemsProcessed24h: 42800,
      avgLatencyMs: 65,
      primaryMetricLabel: "Node Ops (24h)",
      primaryMetricValue: "42,800 nodes (340 merges)",
      lastHealthCheck: new Date().toISOString(),
    },
    {
      agentId: "AGT-027",
      name: "Factory Intake Router Agent",
      type: "FACTORY_INTAKE_ROUTER",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.98,
      itemsProcessed24h: 42100,
      avgLatencyMs: 120,
      primaryMetricLabel: "Packages Routed",
      primaryMetricValue: "42,100 pkgs (6 types)",
      lastHealthCheck: new Date().toISOString(),
    },
    {
      agentId: "AGT-028",
      name: "Compliance Pre-Checker Gatekeeper",
      type: "COMPLIANCE_PRE_CHECKER",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 100.0,
      itemsProcessed24h: 42100,
      avgLatencyMs: 18,
      primaryMetricLabel: "Compliance Checks",
      primaryMetricValue: "96.2% CLEARED · 0 blocked",
      lastHealthCheck: new Date().toISOString(),
    },
    {
      agentId: "AGT-029",
      name: "Distribution Scheduler Agent",
      type: "DISTRIBUTION_SCHEDULER",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.99,
      itemsProcessed24h: 42100,
      avgLatencyMs: 51,
      primaryMetricLabel: "Scheduled Drops",
      primaryMetricValue: "42,100 scheduled (8 plts)",
      lastHealthCheck: new Date().toISOString(),
    },
    {
      agentId: "AGT-030",
      name: "Analytics Engagement Telemetry Collector",
      type: "ANALYTICS_COLLECTOR",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.98,
      itemsProcessed24h: 248000,
      avgLatencyMs: 42,
      primaryMetricLabel: "Metrics Ingested",
      primaryMetricValue: "248k events (0 anomalies)",
      lastHealthCheck: new Date().toISOString(),
    },
    {
      agentId: "AGT-031",
      name: "Learning Feedback Loop Agent",
      type: "LEARNING_FEEDBACK_LOOP",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.97,
      itemsProcessed24h: 24,
      avgLatencyMs: 210,
      primaryMetricLabel: "Models Updated",
      primaryMetricValue: "24 models updated ▲ +15%",
      lastHealthCheck: new Date().toISOString(),
    },
    {
      agentId: "AGT-032",
      name: "Operations Monitor Meta-Agent",
      type: "OPERATIONS_MONITOR",
      squad: "PIPELINE",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 100.0,
      itemsProcessed24h: 32,
      avgLatencyMs: 15,
      primaryMetricLabel: "Fleet Matrix Health",
      primaryMetricValue: "32/32 agents nominal",
      lastHealthCheck: new Date().toISOString(),
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

// Sample data sets for the 8 specialized pipeline agent view decks
const SAMPLE_INGESTION_DATA: IngestionRoutingData = {
  tierCounts: {
    verifiedTruth: 101200,
    provisional: 11400,
    doubtful: 2250,
  },
  priorityCounts: {
    breaking: 17200,
    high: 40200,
    standard: 45800,
    low: 11650,
  },
  lifecycleCounts: {
    received: 114850,
    routed: 114850,
    processing: 42800,
    delivered: 42100,
    failed: 0,
  },
  idempotency: {
    duplicatesDetected: 14200,
    successfullyDeduplicated: 14200,
  },
};

const SAMPLE_STORY_GRAPH_DATA: StoryGraphUpdaterData = {
  nodeOps: {
    created: 28400,
    updated: 14060,
    merged: 340,
  },
  lifecycleCounts: {
    emerging: 12400,
    developing: 15600,
    verified: 10800,
    published: 3800,
    corrected: 200,
  },
  entityStats: {
    entitiesFound: 84200,
    relationshipsCreated: 142600,
  },
  mergeStats: {
    mergesDetected: 340,
    avgOverlapScore: 0.94,
  },
  graphMetrics: {
    totalNodes: 1450000,
    totalEdges: 3890000,
    density: 0.0034,
  },
};

const SAMPLE_FACTORY_INTAKE: FactoryIntakeData = {
  packageTypeCounts: {
    article: 14200,
    socialPost: 18400,
    videoScript: 4100,
    audioTranscript: 1800,
    infographicSpec: 1200,
    multiChannel: 2400,
  },
  assetValidation: {
    complete: 41800,
    missing: 200,
    generating: 100,
  },
  brandVoice: {
    avgCompatibilityScore: 0.96,
    mismatchesFlagged: 14,
  },
  priorityAlignmentPct: 100,
};

const SAMPLE_COMPLIANCE_DATA: ComplianceScanData = {
  statusCounts: {
    cleared: 40500,
    reviewRequired: 1400,
    flagged: 200,
    blocked: 0,
  },
  factorScans: {
    copyright: true,
    fairUse: true,
    licensing: true,
    libel: true,
    privacy: true,
    embargo: true,
  },
  fairUseAvgScore: 0.96,
  recentFlags: [
    {
      id: "flg-p101",
      title: "Third-Party Wire Attribution Syntax Advisory",
      riskFactor: "Copyright / Fair Use Citation",
      remediationStep: "Enforce standard Reuters syntax block at trailing paragraph.",
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    },
  ],
};

const SAMPLE_DISTRIBUTION_DATA: DistributionSchedulerData = {
  slotCounts: {
    immediate: 32400,
    scheduled: 8500,
    embargoed: 1200,
  },
  platformBreakdown: [
    { platform: "Twitter/X", count: 18200, status: "ONLINE" },
    { platform: "Facebook", count: 8400, status: "ONLINE" },
    { platform: "LinkedIn", count: 4500, status: "ONLINE" },
    { platform: "Instagram", count: 6200, status: "ONLINE" },
    { platform: "YouTube", count: 2100, status: "ONLINE" },
    { platform: "Reddit", count: 1800, status: "ONLINE" },
    { platform: "RSS", count: 900, status: "ONLINE" },
  ],
  crossPlatformSequencingPct: 99.8,
  embargoes: {
    activeCount: 1200,
    upcomingCount: 340,
  },
};

const SAMPLE_ANALYTICS_DATA: AnalyticsCollectorData = {
  metrics24h: {
    views: 1845000,
    likes: 142000,
    shares: 48500,
    comments: 18200,
    clickThrough: 94000,
  },
  aggregates: {
    totalEngagement: 208700,
    crossPlatformReach: 3450000,
    amplificationRate: 11.3,
  },
  anomalies: {
    detectedCount: 0,
    byType: [],
  },
  timeSeriesPointsStored: 14500000,
  platformComparison: [
    { platform: "Twitter/X", views: 920000, reach: 1800000, engagementRate: 4.8 },
    { platform: "Facebook", views: 420000, reach: 750000, engagementRate: 3.2 },
    { platform: "LinkedIn", views: 245000, reach: 450000, engagementRate: 6.4 },
    { platform: "Instagram", views: 260000, reach: 450000, engagementRate: 5.1 },
  ],
};

const SAMPLE_FEEDBACK_IMPACT: FeedbackImpactData = {
  modelsUpdated24h: 24,
  trendChangePct: 15,
  credibilityChanges: {
    increased: 42,
    decreased: 3,
  },
  accuracyTrendSeries: [
    { day: "Day 1", accuracyPct: 96.8 },
    { day: "Day 2", accuracyPct: 97.2 },
    { day: "Day 3", accuracyPct: 97.5 },
    { day: "Day 4", accuracyPct: 98.1 },
    { day: "Day 5", accuracyPct: 98.6 },
    { day: "Day 6", accuracyPct: 98.9 },
    { day: "Day 7", accuracyPct: 99.1 },
  ],
  driftAlertsCount: 0,
  biasCreepAlertsCount: 0,
  modelHistory: [
    {
      version: "2.1.0",
      modelId: "virality-mape-model-v2",
      updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      changeType: "MAPE weights recalibrated (-0.4% error delta)",
    },
    {
      version: "1.4.0",
      modelId: "source-authority-ledger-v1",
      updatedAt: new Date(Date.now() - 120 * 60000).toISOString(),
      changeType: "Added 12 newly accredited domain authority scores",
    },
  ],
};

const SAMPLE_OPS_META: OpsMetaAgentData = {
  fleetMatrix: {
    healthy: 30,
    degraded: 1,
    rateLimited: 1,
    authFailed: 0,
    offline: 0,
  },
  throughputSummary: {
    signals: 114850,
    detections: 114850,
    verifications: 42800,
    routing: 42100,
    distribution: 42100,
  },
  alertSummary: {
    critical: 1,
    warning: 3,
    info: 1,
  },
  agentHealthList: [
    {
      agentId: "AGT-001",
      name: "Twitter/X Monitor",
      squad: "MONITORS",
      status: "HEALTHY",
      uptime: 99.98,
      p50: 110,
      p95: 142,
      p99: 210,
    },
    {
      agentId: "AGT-017",
      name: "Fact-Check Agent",
      squad: "VERIFICATION",
      status: "RATE_LIMITED",
      uptime: 99.95,
      p50: 180,
      p95: 290,
      p99: 410,
    },
    {
      agentId: "AGT-028",
      name: "Compliance Pre-Checker",
      squad: "PIPELINE",
      status: "HEALTHY",
      uptime: 100.0,
      p50: 12,
      p95: 18,
      p99: 25,
    },
  ],
};

const SAMPLE_PIPELINE_STAGES: PipelineStageFlowItem[] = [
  {
    stageId: "SIGNALS",
    label: "Stage 1: Multi-Platform Signal Ingestion",
    itemsPerHour: 4850,
    queueDepth: 42,
    avgProcessingTimeMs: 45,
    isBottleneck: false,
  },
  {
    stageId: "DETECTIONS",
    label: "Stage 2: Factual Claim & Anomaly Detection",
    itemsPerHour: 4120,
    queueDepth: 85,
    avgProcessingTimeMs: 120,
    isBottleneck: false,
  },
  {
    stageId: "VERIFICATIONS",
    label: "Stage 3: AGT-017–024 Autonomous Truth Engine",
    itemsPerHour: 2980,
    queueDepth: 340,
    avgProcessingTimeMs: 840,
    isBottleneck: true,
  },
  {
    stageId: "ROUTING",
    label: "Stage 4: Content Factory Packaging & AGT-028",
    itemsPerHour: 3100,
    queueDepth: 28,
    avgProcessingTimeMs: 290,
    isBottleneck: false,
  },
  {
    stageId: "DISTRIBUTION",
    label: "Stage 5: Multi-Channel Syndication & Reader Feed",
    itemsPerHour: 3080,
    queueDepth: 12,
    avgProcessingTimeMs: 180,
    isBottleneck: false,
  },
];

const SAMPLE_BOTTLENECK: BottleneckAlertData = {
  stageName: "Stage 3: AGT-017–024 Autonomous Truth Engine",
  queueDepth: 340,
  processingRatePerHour: 2980,
  severity: "HIGH",
  autoScaleRecommendation: "+4 verification worker threads recommended for AIGatewayService pool",
  historicalFrequencyPct: 14.2,
};

export default function PipelineAgentDetailPage({
  params,
}: PipelineDetailPageProps): React.JSX.Element {
  const router = useRouter();
  const { agentId } = params;

  const [agent, setAgent] = useState<PipelineAgentItem>(() =>
    resolvePipelineMetadata(agentId),
  );
  const [ingestionData] = useState<IngestionRoutingData>(SAMPLE_INGESTION_DATA);
  const [storyGraphData] = useState<StoryGraphUpdaterData>(
    SAMPLE_STORY_GRAPH_DATA,
  );
  const [factoryIntakeData] = useState<FactoryIntakeData>(SAMPLE_FACTORY_INTAKE);
  const [complianceData] = useState<ComplianceScanData>(SAMPLE_COMPLIANCE_DATA);
  const [distributionData] = useState<DistributionSchedulerData>(
    SAMPLE_DISTRIBUTION_DATA,
  );
  const [analyticsData] = useState<AnalyticsCollectorData>(
    SAMPLE_ANALYTICS_DATA,
  );
  const [feedbackData] = useState<FeedbackImpactData>(SAMPLE_FEEDBACK_IMPACT);
  const [opsMetaData] = useState<OpsMetaAgentData>(SAMPLE_OPS_META);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  const loadPipelineTelemetry = useCallback(async () => {
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
        setError(resp.error?.message || "Failed to load pipeline agent detail from BFF.");
      } else {
        setAgent(resolvePipelineMetadata(agentId));
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
      loadPipelineTelemetry();
    }
  }, [loadPipelineTelemetry, simulateMode]);

  const statusBadge = getStatusStyle(agent.status);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/pipeline")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Pipeline Squad
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
            onClick={() => router.push("/agents/pipeline")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Pipeline Squad
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
            Pipeline Agent Telemetry Retrieval Failed
          </h3>
          <p className="mb-6 text-xs text-[#A0A4A8]">
            We could not retrieve the requested pipeline agent telemetry from AIGatewayService.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "error") setSimulateMode("normal");
                else loadPipelineTelemetry();
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/agents/pipeline")}
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
            onClick={() => router.push("/agents/pipeline")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Pipeline Squad
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
            Zero pipeline events for {agent.agentId} ({agent.name})
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The pipeline engine has zero items routed or processed in the selected window. The runtime process is connected and nominal.
          </p>
          <button
            type="button"
            onClick={() => setSimulateMode("normal")}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Pipeline Ledger
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
          onClick={() => router.push("/agents/pipeline")}
          className="text-xs font-semibold text-[#3399FF] hover:underline"
        >
          ← Back to Pipeline Agents Squad
        </button>
        <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* COMMON AGENT HEADER CARD */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow md:flex-row md:items-center">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#2E2E32] bg-[#0A0A0B] text-2xl font-bold text-amber-400">
            ⚡
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#0A0A0B] px-2.5 py-0.5 font-mono text-xs font-bold text-[#FAFAFA] border border-[#2E2E32]">
                {agent.agentId}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${statusBadge.style}`}
              >
                ● {statusBadge.label}
              </span>
              <span className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[11px] text-[#A0A4A8] border border-[#2E2E32]">
                v:{agent.version}
              </span>
              <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/30">
                {agent.squad} SQUAD
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-[#FAFAFA] md:text-2xl">
              {agent.name}
            </h1>
          </div>
        </div>

        {/* AGENT ACTIONS TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              alert(`Process restart signal dispatched to ${agent.agentId}. Runtime state refreshed.`)
            }
            className="rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
          >
            ↻ Restart Engine
          </button>
          <button
            type="button"
            onClick={() => alert(`Authoritative configuration reloaded for ${agent.agentId}.`)}
            className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ⚙ Reload Config
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
            {agent.uptime}% <span className="text-xs font-normal text-[#0D9040]">▲ Nominal</span>
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
            {agent.itemsProcessed24h.toLocaleString()}{" "}
            <span className="text-xs font-normal text-[#3399FF]">▲ +15%</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            {agent.primaryMetricLabel}
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Throughput Velocity
          </div>
          <div className="mt-2 text-2xl font-bold text-[#3399FF]">
            {Math.round(agent.itemsProcessed24h / 24).toLocaleString()} items/hr
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Continuous orchestration
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Avg Processing Latency (p95)
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-[#6C5CE7]">
            {agent.avgLatencyMs}ms
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            AIGatewayService turnaround
          </div>
        </div>
      </div>

      {/* DYNAMIC VISUALIZATIONS BY PIPELINE AGENT ID */}
      {agent.agentId === "AGT-025" && (
        <div className="space-y-6">
          <IngestionMetrics data={ingestionData} />
        </div>
      )}

      {agent.agentId === "AGT-026" && (
        <div className="space-y-6">
          {/* STORY GRAPH UPDATER DASHBOARD */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-026 Story Graph Knowledge Base Node Operations &amp; Entity Extraction
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
                <div className="text-xs font-bold text-[#0D9040]">
                  NODES CREATED (24h)
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {storyGraphData.nodeOps.created.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#3399FF]/30 bg-[#3399FF]/10 p-4">
                <div className="text-xs font-bold text-[#3399FF]">
                  NODES UPDATED (24h)
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {storyGraphData.nodeOps.updated.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="text-xs font-bold text-amber-400">
                  STORY MERGES DETECTED
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {storyGraphData.nodeOps.merged} (avg {storyGraphData.mergeStats.avgOverlapScore} overlap)
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#2E2E32] pt-4 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-[#A0A4A8]">Total Knowledge Graph Nodes:</span>
                <div className="text-xl font-bold text-[#FAFAFA]">
                  {storyGraphData.graphMetrics.totalNodes.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-[#A0A4A8]">Total Semantic Edges:</span>
                <div className="text-xl font-bold text-[#3399FF]">
                  {storyGraphData.graphMetrics.totalEdges.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-[#A0A4A8]">Relationships Created (24h):</span>
                <div className="text-xl font-bold text-[#6C5CE7]">
                  {storyGraphData.entityStats.relationshipsCreated.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-027" && (
        <div className="space-y-6">
          {/* FACTORY INTAKE ROUTER DASHBOARD */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-027 Content Factory Package Intake Distribution &amp; Asset Validation (42,100 packages)
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#3399FF]">ARTICLE</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {factoryIntakeData.packageTypeCounts.article.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#6C5CE7]">SOCIAL_POST</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {factoryIntakeData.packageTypeCounts.socialPost.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#0D9040]">VIDEO_SCRIPT</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {factoryIntakeData.packageTypeCounts.videoScript.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-amber-400">AUDIO_TRANS</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {factoryIntakeData.packageTypeCounts.audioTranscript.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#CF2020]">INFOGRAPHIC</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {factoryIntakeData.packageTypeCounts.infographicSpec.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#FAFAFA]">MULTI_CHANNEL</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {factoryIntakeData.packageTypeCounts.multiChannel.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#2E2E32] pt-4 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-[#A0A4A8]">Complete Asset Bundles:</span>
                <div className="text-xl font-bold text-[#0D9040]">
                  {factoryIntakeData.assetValidation.complete.toLocaleString()} pkgs
                </div>
              </div>
              <div>
                <span className="text-[#A0A4A8]">Brand Voice Compatibility Avg:</span>
                <div className="text-xl font-bold text-[#3399FF]">
                  {(factoryIntakeData.brandVoice.avgCompatibilityScore * 100).toFixed(0)}% Match
                </div>
              </div>
              <div>
                <span className="text-[#A0A4A8]">Priority Alignment Rate:</span>
                <div className="text-xl font-bold text-[#FAFAFA]">
                  {factoryIntakeData.priorityAlignmentPct}% aligned
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-028" && (
        <div className="space-y-6">
          <ComplianceSummary data={complianceData} />
        </div>
      )}

      {agent.agentId === "AGT-029" && (
        <div className="space-y-6">
          {/* DISTRIBUTION SCHEDULER DASHBOARD */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-029 Multi-Channel Distribution Scheduler &amp; Embargo Ledger (42,100 drops)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
                <div className="text-xs font-bold text-[#0D9040]">IMMEDIATE DROPS</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {distributionData.slotCounts.immediate.toLocaleString()} (77%)
                </div>
              </div>
              <div className="rounded border border-[#3399FF]/30 bg-[#3399FF]/10 p-4">
                <div className="text-xs font-bold text-[#3399FF]">SCHEDULED RELEASES</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {distributionData.slotCounts.scheduled.toLocaleString()} (20%)
                </div>
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="text-xs font-bold text-amber-400">EMBARGOED HOLDS</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {distributionData.slotCounts.embargoed.toLocaleString()} (3%)
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
                Per-Platform Syndication Breakdown &amp; Connector Availability
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {distributionData.platformBreakdown.map((pb: any) => (
                  <div
                    key={pb.platform}
                    className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#FAFAFA]">{pb.platform}</span>
                      <span className="rounded bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
                        ● {pb.status}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-bold text-[#3399FF]">
                      {pb.count.toLocaleString()} <span className="text-[11px] font-normal text-[#A0A4A8]">drops</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-030" && (
        <div className="space-y-6">
          {/* ANALYTICS COLLECTOR DASHBOARD */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-030 Analytics Engagement Telemetry Collector (248,000 metrics ingested 24h)
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#3399FF]">VIEWS</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {analyticsData.metrics24h.views.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#6C5CE7]">LIKES</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {analyticsData.metrics24h.likes.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#0D9040]">SHARES</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {analyticsData.metrics24h.shares.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-amber-400">COMMENTS</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {analyticsData.metrics24h.comments.toLocaleString()}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#CF2020]">CLICK-THROUGH</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {analyticsData.metrics24h.clickThrough.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#2E2E32] pt-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
                Per-Platform Engagement Comparison
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                {analyticsData.platformComparison.map((pc: any) => (
                  <div
                    key={pc.platform}
                    className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-xs"
                  >
                    <div className="font-bold text-[#FAFAFA]">{pc.platform}</div>
                    <div className="mt-1 text-[#A0A4A8]">
                      Reach: <strong className="text-[#3399FF]">{pc.reach.toLocaleString()}</strong>
                    </div>
                    <div className="text-[#A0A4A8]">
                      Engagement Rate: <strong className="text-[#0D9040]">{pc.engagementRate}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-031" && (
        <div className="space-y-6">
          <FeedbackImpact data={feedbackData} />
        </div>
      )}

      {agent.agentId === "AGT-032" && (
        <div className="space-y-6">
          {/* OPERATIONS MONITOR META-AGENT DASHBOARD */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              AGT-032 Operations Monitor Meta-Agent — 31-Agent Fleet Health Matrix
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-3 text-center">
                <div className="text-xs font-bold text-[#0D9040]">HEALTHY</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {opsMetaData.fleetMatrix.healthy}
                </div>
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                <div className="text-xs font-bold text-amber-400">DEGRADED</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {opsMetaData.fleetMatrix.degraded}
                </div>
              </div>
              <div className="rounded border border-orange-500/30 bg-orange-500/10 p-3 text-center">
                <div className="text-xs font-bold text-orange-400">RATE_LIMITED</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {opsMetaData.fleetMatrix.rateLimited}
                </div>
              </div>
              <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-3 text-center">
                <div className="text-xs font-bold text-[#CF2020]">AUTH_FAILED</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {opsMetaData.fleetMatrix.authFailed}
                </div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#2E2E32]/40 p-3 text-center">
                <div className="text-xs font-bold text-[#A0A4A8]">OFFLINE</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {opsMetaData.fleetMatrix.offline}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTLENECK ALERT & THROUGHPUT CHART ON AGT-032 */}
          <BottleneckAlert data={SAMPLE_BOTTLENECK} />
          <ThroughputChart stages={SAMPLE_PIPELINE_STAGES} />
        </div>
      )}

      {/* ALL AGENTS: FULL AGENT RUNTIME ACTIONS TOOLBAR */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#FAFAFA]">
            AIGatewayService Runtime Process Controls ({agent.agentId})
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => alert(`Pipeline agent ${agent.agentId} paused.`)}
              className="rounded bg-amber-500/20 px-3 py-1 font-semibold text-amber-400 hover:bg-amber-500/30"
            >
              ⏸ Pause Agent
            </button>
            <button
              type="button"
              onClick={() => alert(`Pipeline agent ${agent.agentId} resumed.`)}
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
  currentMode: "normal" | "loading" | "empty" | "error";
  onSelectMode: (mode: "normal" | "loading" | "empty" | "error") => void;
}

function SimulationDetailToolbar({
  currentMode,
  onSelectMode,
}: SimulationDetailToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-1 rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-1 text-[11px]">
      <span className="px-1 text-[#A0A4A8]">State:</span>
      {(["normal", "loading", "empty", "error"] as const).map((mode) => (
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
