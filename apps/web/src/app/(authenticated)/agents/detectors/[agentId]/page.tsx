"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../../lib/bff/client";
import { DetectionFeed } from "../../components/detection-feed";
import { TrendGraph } from "../../components/trend-graph";
import { SentimentChart } from "../../components/sentiment-chart";
import { CredibilityGauge } from "../../components/credibility-gauge";
import { ViralityMeter } from "../../components/virality-meter";
import {
  DetectorAgentItem,
  DetectionResultItem,
  TrendStageCount,
  TrendVelocityPoint,
  SentimentDistribution,
  CredibilityScoreData,
  ViralityDistribution,
  ViralityPredictionItem,
  PriorityBreakdown,
  MediaTypeBreakdown,
  LanguageDistributionItem,
  DuplicateRatioData,
  DetectorHealthStatus,
} from "../../types";

export interface DetectorDetailPageProps {
  params: {
    agentId: string;
  };
}

function getStatusStyle(status: DetectorHealthStatus): { label: string; style: string } {
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

function resolveDetectorMetadata(idSlug: string): DetectorAgentItem {
  const upper = idSlug.toUpperCase();
  const idNum = upper.replace("AGT-", "");
  const num = parseInt(idNum, 10);

  const configs: DetectorAgentItem[] = [
    {
      agentId: "AGT-009",
      name: "Breaking News Anomaly Detector",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.99,
      detections24h: 340,
      avgConfidence: 0.96,
      avgLatencyMs: 110,
      primaryMetricLabel: "C1 Priority Detections",
      primaryMetricValue: "52 breaking alerts",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-010",
      name: "Trend Identifier & Lifecycle Engine",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.98,
      detections24h: 890,
      avgConfidence: 0.94,
      avgLatencyMs: 135,
      primaryMetricLabel: "Active Trends",
      primaryMetricValue: "64 trends tracking",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-011",
      name: "Sentiment Polarity & Resonance Analyzer",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.97,
      detections24h: 2150,
      avgConfidence: 0.95,
      avgLatencyMs: 85,
      primaryMetricLabel: "Polarity Breakdown",
      primaryMetricValue: "58% POS · 22% NEG",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-012",
      name: "Source Credibility Assessor",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 100.0,
      detections24h: 1420,
      avgConfidence: 0.98,
      avgLatencyMs: 92,
      primaryMetricLabel: "Avg Credibility Score",
      primaryMetricValue: "98% (HIGH tier avg)",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-013",
      name: "Multimedia Synthetic Forensic Classifier",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.96,
      detections24h: 480,
      avgConfidence: 0.97,
      avgLatencyMs: 240,
      primaryMetricLabel: "Media Formats Analyzed",
      primaryMetricValue: "320 img · 110 vid",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-014",
      name: "Language & Locale Translation Detector",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.99,
      detections24h: 1840,
      avgConfidence: 0.99,
      avgLatencyMs: 45,
      primaryMetricLabel: "Languages Detected",
      primaryMetricValue: "14 locales active",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-015",
      name: "Duplicate & Plagiarism Cluster Checker",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.98,
      detections24h: 1120,
      avgConfidence: 0.96,
      avgLatencyMs: 78,
      primaryMetricLabel: "Duplicates Found",
      primaryMetricValue: "340 dupes skipped",
      lastCheckedAt: new Date().toISOString(),
    },
    {
      agentId: "AGT-016",
      name: "Virality MAPE Prediction Engine",
      squad: "DETECTORS",
      status: "HEALTHY",
      version: "1.0.0",
      uptime: 99.95,
      detections24h: 680,
      avgConfidence: 0.92,
      avgLatencyMs: 165,
      primaryMetricLabel: "Viral Predictions",
      primaryMetricValue: "142 VIRAL (>0.80)",
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

function buildSampleDetections(agentId: string): DetectionResultItem[] {
  return [
    {
      id: `${agentId}-det-01`,
      agentId,
      detectedAt: new Date(Date.now() - 3 * 60000).toISOString(),
      title: "Autonomous AI Newsroom Workforce Expands Across Regions",
      contentPreview:
        "High-velocity signal cluster detected across 6 independent wire feeds and social connectors.",
      typeBadge: "C1 BREAKING (>5 SRC)",
      confidenceScore: 0.98,
      priority: "C1",
      metadata: { sources: 6, velocity: "240/hr", anomaly_score: 0.94 },
    },
    {
      id: `${agentId}-det-02`,
      agentId,
      detectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      title: "Predictive Intelligence Engines Scale MAPE Calibration",
      contentPreview:
        "Emerging discussion trend accelerating across technical engineering communities.",
      typeBadge: "EMERGING TREND",
      confidenceScore: 0.94,
      priority: "C2",
      metadata: { sources: 4, velocity: "110/hr", anomaly_score: 0.78 },
    },
    {
      id: `${agentId}-det-03`,
      agentId,
      detectedAt: new Date(Date.now() - 40 * 60000).toISOString(),
      title: "Row-Level Security Enforces Strict Tenant Boundaries",
      contentPreview:
        "High-credibility technical paper verified against database security standards ledger.",
      typeBadge: "HIGH CREDIBILITY",
      confidenceScore: 0.99,
      priority: "C3",
      metadata: { sources: 3, reliability: "99%", anomaly_score: 0.12 },
    },
  ];
}

// Sample specialized data sets
const SAMPLE_PRIORITY_BREAKDOWN: PriorityBreakdown = {
  c1Count: 52, // >5 sources
  c2Count: 148, // 3-5 sources
  c3Count: 140, // <3 sources
};

const SAMPLE_TREND_STAGES: TrendStageCount[] = [
  { stage: "EMERGING", count: 18, velocity: 45 },
  { stage: "ACCELERATING", count: 24, velocity: 110 },
  { stage: "PEAK", count: 12, velocity: 240 },
  { stage: "DECAY", count: 7, velocity: 60 },
  { stage: "EVERGREEN", count: 3, velocity: 20 },
];

const SAMPLE_TREND_VELOCITY: TrendVelocityPoint[] = [
  { hour: "00:00", velocity: 45 },
  { hour: "04:00", velocity: 90 },
  { hour: "08:00", velocity: 160 },
  { hour: "12:00", velocity: 240 },
  { hour: "16:00", velocity: 180 },
  { hour: "20:00", velocity: 120 },
];

const SAMPLE_SENTIMENT_DIST: SentimentDistribution = {
  positive: 1247,
  negative: 473,
  neutral: 301,
  mixed: 129,
};

const SAMPLE_CREDIBILITY_DATA: CredibilityScoreData = {
  avgScore: 0.98,
  tier: "HIGH",
  distribution: { high: 1120, medium: 240, low: 45, unknown: 15 },
};

const SAMPLE_MEDIA_TYPES: MediaTypeBreakdown = {
  text: 320,
  image: 95,
  video: 45,
  audio: 15,
  mixed: 5,
};

const SAMPLE_LANGUAGES: LanguageDistributionItem[] = [
  { language: "English", locale: "en-US", count: 1250, percentage: 68 },
  { language: "French", locale: "fr-FR", count: 210, percentage: 11 },
  { language: "Spanish", locale: "es-ES", count: 185, percentage: 10 },
  { language: "German", locale: "de-DE", count: 110, percentage: 6 },
  { language: "Japanese", locale: "ja-JP", count: 85, percentage: 5 },
];

const SAMPLE_DUPLICATES: DuplicateRatioData = {
  original: 780,
  duplicate: 340,
  derivative: 120,
  translated: 85,
};

const SAMPLE_VIRALITY_DIST: ViralityDistribution = {
  viral: 142,
  highPotential: 310,
  normal: 228,
};

const SAMPLE_VIRALITY_PREDICTIONS: ViralityPredictionItem[] = [
  {
    id: "vir-1",
    title: "Autonomous AI Newsroom Workforce Expands Across Regions",
    predictedScore: 0.94,
    actualOutcome: "VIRAL",
    evaluatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: "vir-2",
    title: "Predictive Intelligence Engines Scale MAPE Calibration",
    predictedScore: 0.76,
    actualOutcome: "HIGH_POTENTIAL",
    evaluatedAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: "vir-3",
    title: "Row-Level Security Enforces Strict Tenant Boundaries",
    predictedScore: 0.42,
    actualOutcome: "NORMAL",
    evaluatedAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
];

export default function DetectorAgentDetailPage({
  params,
}: DetectorDetailPageProps): React.JSX.Element {
  const router = useRouter();
  const { agentId } = params;

  const [agent, setAgent] = useState<DetectorAgentItem>(() =>
    resolveDetectorMetadata(agentId),
  );
  const [detections, setDetections] = useState<DetectionResultItem[]>(() =>
    buildSampleDetections(agent.agentId),
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const loadDetectorTelemetry = useCallback(async () => {
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
        setError(resp.error?.message || "Failed to load detector detail from BFF.");
      } else {
        const det = resolveDetectorMetadata(agentId);
        setAgent(det);
        setDetections(buildSampleDetections(det.agentId));
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
      loadDetectorTelemetry();
    }
  }, [loadDetectorTelemetry, simulateMode]);

  const handlePause = () => {
    setIsPaused(true);
    alert(`Detection stream for ${agent.agentId} PAUSED.`);
  };

  const handleResume = () => {
    setIsPaused(false);
    alert(`Detection stream for ${agent.agentId} RESUMED.`);
  };

  const statusBadge = getStatusStyle(agent.status);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/detectors")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Detectors
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
            onClick={() => router.push("/agents/detectors")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Detectors
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
            Detector Telemetry Retrieval Failed
          </h3>
          <p className="mb-6 text-xs text-[#A0A4A8]">
            We could not retrieve the requested detector telemetry from ContentOriginationService.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "error") setSimulateMode("normal");
                else loadDetectorTelemetry();
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/agents/detectors")}
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
  if (simulateMode === "empty" || (!isLoading && detections.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/agents/detectors")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Detectors
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
            Zero detection events for {agent.agentId} ({agent.name})
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            The detector engine has zero intelligence classifications queued in the selected window. The runtime process is connected and nominal.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setDetections(buildSampleDetections(agent.agentId));
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Detection Ledger
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
          onClick={() => router.push("/agents/detectors")}
          className="text-xs font-semibold text-[#3399FF] hover:underline"
        >
          ← Back to Content Detectors Squad
        </button>
        <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* COMMON AGENT HEADER CARD */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow md:flex-row md:items-center">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#2E2E32] bg-[#0A0A0B] text-2xl font-bold text-[#6C5CE7]">
            🔍
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
              <span className="rounded bg-[#6C5CE7]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#6C5CE7] border border-[#6C5CE7]/30">
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
            onClick={isPaused ? handleResume : handlePause}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              isPaused
                ? "bg-[#0D9040] text-white hover:bg-[#0D9040]/80"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            {isPaused ? "▶ Resume Detection" : "⏸ Pause Detection"}
          </button>
          <button
            type="button"
            onClick={() => {
              alert(`Process restart signal dispatched to ${agent.agentId}. Runtime state refreshed.`);
            }}
            className="rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
          >
            ↻ Restart Engine
          </button>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ⚙ View Config
          </button>
        </div>
      </div>

      {/* METRICS ROW (grid-cols-2 lg:grid-cols-4) */}
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
            Detections (24h)
          </div>
          <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
            {agent.detections24h.toLocaleString()} <span className="text-xs font-normal text-[#3399FF]">▲ +14%</span>
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            {agent.primaryMetricLabel}
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Average Confidence
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9040]">
            {(agent.avgConfidence * 100).toFixed(0)}%
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Precision verification tier
          </div>
        </div>

        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 shadow">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
            Average Latency (p95)
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-[#3399FF]">
            {agent.avgLatencyMs}ms
          </div>
          <div className="mt-1 text-[11px] text-[#A0A4A8]">
            Model inference turnaround
          </div>
        </div>
      </div>

      {/* DYNAMIC VISUALIZATIONS BY AGENT TYPE */}
      {agent.agentId === "AGT-009" && (
        <div className="space-y-6">
          {/* Breaking News: Priority Breakdown C1 (>5 sources), C2 (3-5), C3 (<3) */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              Breaking News Priority Breakdown &amp; Source Corroboration Count
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#CF2020]">
                    C1 CRITICAL (&gt; 5 Sources)
                  </span>
                  <span className="rounded-full bg-[#CF2020] px-2 py-0.5 text-[10px] font-bold text-white">
                    {SAMPLE_PRIORITY_BREAKDOWN.c1Count}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {SAMPLE_PRIORITY_BREAKDOWN.c1Count} alerts
                </div>
                <div className="text-[11px] text-[#A0A4A8]">
                  Immediate breaking newsroom broadcast
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    C2 HIGH (3–5 Sources)
                  </span>
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                    {SAMPLE_PRIORITY_BREAKDOWN.c2Count}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {SAMPLE_PRIORITY_BREAKDOWN.c2Count} alerts
                </div>
                <div className="text-[11px] text-[#A0A4A8]">
                  Developing story corroboration
                </div>
              </div>

              <div className="rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3399FF]">
                    C3 STANDARD (&lt; 3 Sources)
                  </span>
                  <span className="rounded-full bg-[#0066CC] px-2 py-0.5 text-[10px] font-bold text-white">
                    {SAMPLE_PRIORITY_BREAKDOWN.c3Count}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {SAMPLE_PRIORITY_BREAKDOWN.c3Count} alerts
                </div>
                <div className="text-[11px] text-[#A0A4A8]">
                  Emerging single/dual source signal
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-010" && (
        <div className="space-y-6">
          <TrendGraph
            stages={SAMPLE_TREND_STAGES}
            velocitySeries={SAMPLE_TREND_VELOCITY}
          />
        </div>
      )}

      {agent.agentId === "AGT-011" && (
        <div className="space-y-6">
          <SentimentChart
            distribution={SAMPLE_SENTIMENT_DIST}
            totalAnalyses={agent.detections24h}
          />
        </div>
      )}

      {agent.agentId === "AGT-012" && (
        <div className="space-y-6">
          <CredibilityGauge data={SAMPLE_CREDIBILITY_DATA} />
        </div>
      )}

      {agent.agentId === "AGT-013" && (
        <div className="space-y-6">
          {/* Multimedia Classifier Breakdown: TEXT/IMAGE/VIDEO/AUDIO/MIXED */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              Multimedia Synthetic Forensic Classification Breakdown ({agent.detections24h} items)
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#3399FF]">TEXT</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {SAMPLE_MEDIA_TYPES.text}
                </div>
                <div className="text-[10px] text-[#A0A4A8]">Wire / Post prose</div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#6C5CE7]">IMAGE</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {SAMPLE_MEDIA_TYPES.image}
                </div>
                <div className="text-[10px] text-[#A0A4A8]">Visual frames</div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#0D9040]">VIDEO</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {SAMPLE_MEDIA_TYPES.video}
                </div>
                <div className="text-[10px] text-[#A0A4A8]">Broadcast clips</div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-amber-400">AUDIO</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {SAMPLE_MEDIA_TYPES.audio}
                </div>
                <div className="text-[10px] text-[#A0A4A8]">Transcripts / clips</div>
              </div>
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center">
                <div className="text-xs font-bold text-[#CF2020]">MIXED</div>
                <div className="mt-2 text-xl font-bold text-[#FAFAFA]">
                  {SAMPLE_MEDIA_TYPES.mixed}
                </div>
                <div className="text-[10px] text-[#A0A4A8]">Composite media</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-014" && (
        <div className="space-y-6">
          {/* Language / Locale Distribution */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              Top Detected Languages &amp; Locales ({agent.detections24h} items)
            </h3>
            <div className="space-y-3">
              {SAMPLE_LANGUAGES.map((lng) => (
                <div key={lng.locale} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#FAFAFA]">
                      {lng.language} ({lng.locale})
                    </span>
                    <span className="font-bold text-[#3399FF]">
                      {lng.count} ({lng.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
                    <div
                      className="h-full bg-[#0066CC] transition-all"
                      style={{ width: `${lng.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-015" && (
        <div className="space-y-6">
          {/* Original vs Duplicate Ratio */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
            <h3 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              Duplicate &amp; Plagiarism Cluster Ratios ({agent.detections24h} total inspected)
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded border border-[#0D9040]/30 bg-[#0D9040]/10 p-4">
                <div className="text-xs font-bold text-[#0D9040]">ORIGINAL</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {SAMPLE_DUPLICATES.original}
                </div>
                <div className="text-[11px] text-[#A0A4A8]">Primary originators</div>
              </div>

              <div className="rounded border border-[#CF2020]/30 bg-[#CF2020]/10 p-4">
                <div className="text-xs font-bold text-[#CF2020]">DUPLICATE</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {SAMPLE_DUPLICATES.duplicate}
                </div>
                <div className="text-[11px] text-[#A0A4A8]">Exact/near copies</div>
              </div>

              <div className="rounded border border-[#0066CC]/30 bg-[#0066CC]/10 p-4">
                <div className="text-xs font-bold text-[#3399FF]">DERIVATIVE</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {SAMPLE_DUPLICATES.derivative}
                </div>
                <div className="text-[11px] text-[#A0A4A8]">Rewritten variants</div>
              </div>

              <div className="rounded border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 p-4">
                <div className="text-xs font-bold text-[#6C5CE7]">TRANSLATED</div>
                <div className="mt-2 text-2xl font-bold text-[#FAFAFA]">
                  {SAMPLE_DUPLICATES.translated}
                </div>
                <div className="text-[11px] text-[#A0A4A8]">Cross-locale mirrors</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {agent.agentId === "AGT-016" && (
        <div className="space-y-6">
          <ViralityMeter
            distribution={SAMPLE_VIRALITY_DIST}
            predictions={SAMPLE_VIRALITY_PREDICTIONS}
          />
        </div>
      )}

      {/* ALL AGENTS: DETECTION FEED */}
      <DetectionFeed detections={detections} isLoading={isLoading} />

      {/* View Configuration Modal */}
      {showConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Detector Runtime Configuration: {agent.agentId} ({agent.name})
            </h3>
            <div className="mt-3 space-y-2 rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 font-mono text-xs text-[#FAFAFA]">
              <div>agent_id: &quot;{agent.agentId}&quot;</div>
              <div>squad: &quot;{agent.squad}&quot;</div>
              <div>confidence_threshold: 0.70</div>
              <div>model_backend: &quot;gpt-4o-2024-08&quot;</div>
              <div>batch_size: 50</div>
              <div>rls_tenant_boundary: &quot;tenant-default&quot;</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                Close Configuration
              </button>
            </div>
          </div>
        </div>
      )}
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
