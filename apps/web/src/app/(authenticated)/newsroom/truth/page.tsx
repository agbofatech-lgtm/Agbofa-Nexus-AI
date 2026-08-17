"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { VerificationPanel } from "../components/verification-panel";
import {
  VerificationClaim,
  MisinformationFlag,
  BiasDetection,
  ConfidenceBreakdown,
} from "../types";

interface VerificationStoryItem {
  storyId: string;
  headline: string;
  sourceName: string;
  detectedAt: string;
  claims: VerificationClaim[];
  misinfo: MisinformationFlag;
  bias: BiasDetection;
  confidence: ConfidenceBreakdown;
}

const SAMPLE_VERIFICATION_STORIES: VerificationStoryItem[] = [
  {
    storyId: "verif-101",
    headline: "Autonomous AI Newsroom Workforce Expands Across Regions",
    sourceName: "Reuters Wire Feed",
    detectedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    confidence: {
      factCheckScore: 0.98,
      crossRefScore: 0.96,
      sourceScore: 0.99,
      evidenceScore: 0.94,
      biasScore: 0.95,
      overallConfidence: 0.964,
      tier: "VERIFIED_TRUTH",
    },
    misinfo: {
      riskClass: "CLEAN",
      riskScore: 0.04,
      severity: "LOW",
      contributingFactors: [
        "Zero synthetic multimedia artifacts detected by AGT-013",
        "Source credibility verified at 99% reliability score",
        "Consistent factual statements across 4 independent wire services",
      ],
    },
    bias: {
      classification: "NONE",
      severityScore: 0.02,
      indicators: [
        {
          textExample: "officially deployed its complete 32-agent workforce",
          description: "Factual reporting style without emotional framing or commercial bias.",
        },
      ],
    },
    claims: [
      {
        claimId: "cl-1",
        claimText:
          "Agbofa Nexus AI has officially deployed 32 specialized agents across news gathering and verification.",
        claimType: "FACTUAL",
        verdict: "TRUE",
        confidence: 0.99,
        crossRefStatus: "Corroborated by 4 independent sources",
        sourceVerification: "AUTHENTICATED",
        evidence: [
          {
            evidenceId: "ev-1",
            claimId: "cl-1",
            type: "SUPPORTING",
            description:
              "Official press release and architecture deployment ledger confirm 32 active agents across 4 squads.",
            source: "Agbofa Technologies Registry (IMP-017)",
            reliability: 0.99,
          },
          {
            evidenceId: "ev-2",
            claimId: "cl-1",
            type: "SUPPORTING",
            description:
              "Reuters wire feed corroborated agent fleet operational status at 10:00 UTC.",
            source: "Reuters Wire News",
            reliability: 0.98,
          },
        ],
      },
      {
        claimId: "cl-2",
        claimText:
          "The autonomous newsroom operates continuously without manual human editorial intervention in standard gathering.",
        claimType: "STATISTICAL",
        verdict: "TRUE",
        confidence: 0.94,
        crossRefStatus: "Corroborated by 2 wire sources",
        sourceVerification: "CREDIBLE",
        evidence: [
          {
            evidenceId: "ev-3",
            claimId: "cl-2",
            type: "SUPPORTING",
            description:
              "System telemetry metrics show continuous 24/7 ingestion across RSS and social adapters.",
            source: "Nexus Ops Health Ledger",
            reliability: 0.96,
          },
        ],
      },
    ],
  },
  {
    storyId: "verif-102",
    headline: "Predictive Intelligence Engines Scale Calibration Metrics",
    sourceName: "LinkedIn Executive Wire",
    detectedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    confidence: {
      factCheckScore: 0.88,
      crossRefScore: 0.85,
      sourceScore: 0.90,
      evidenceScore: 0.84,
      biasScore: 0.89,
      overallConfidence: 0.87,
      tier: "PROVISIONAL",
    },
    misinfo: {
      riskClass: "CLEAN",
      riskScore: 0.12,
      severity: "LOW",
      contributingFactors: [
        "Minor statistical variance in forecasted virality MAPE estimates",
      ],
    },
    bias: {
      classification: "COMMERCIAL",
      severityScore: 0.15,
      indicators: [
        {
          textExample: "delivering industry-leading MAPE accuracy",
          description: "Slight commercial promotional language in executive quote.",
        },
      ],
    },
    claims: [
      {
        claimId: "cl-3",
        claimText:
          "Five predictive models evaluate story virality and trend lifecycle transitions.",
        claimType: "FACTUAL",
        verdict: "TRUE",
        confidence: 0.91,
        crossRefStatus: "Corroborated by 3 sources",
        sourceVerification: "AUTHENTICATED",
        evidence: [
          {
            evidenceId: "ev-4",
            claimId: "cl-3",
            type: "SUPPORTING",
            description: "Predictive Intelligence Engine (IMP-018) codebase verification.",
            source: "Nexus Codebase Ledger",
            reliability: 0.99,
          },
        ],
      },
    ],
  },
];

export default function TruthVerificationPage(): React.JSX.Element {
  const router = useRouter();
  const [stories, setStories] = useState<VerificationStoryItem[]>(SAMPLE_VERIFICATION_STORIES);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(
    SAMPLE_VERIFICATION_STORIES[0].storyId,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function loadVerificationQueue() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; status_filter: string },
          { packages?: unknown[] }
        >("content_factory.v1.ContentFactoryService", "ListPackages", {
          tenant_id: "tenant-default",
          status_filter: "APPROVED",
        });
        if (resp.status === "ERROR") {
          setError(resp.error?.message || "Failed to load verification queue from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadVerificationQueue();
  }, []);

  const activeStory =
    stories.find((s) => s.storyId === selectedStoryId) || stories[0];

  const handleVerifyStory = () => {
    alert(`Story ${activeStory.storyId} authoritatively verified! Ready for Content Factory packaging.`);
  };

  const handleDisputeClaim = (claimId: string) => {
    const updated = stories.map((s) => {
      if (s.storyId !== activeStory.storyId) return s;
      return {
        ...s,
        claims: s.claims.map((c) =>
          c.claimId === claimId ? { ...c, verdict: "UNVERIFIED" as const, confidence: 0.5 } : c,
        ),
      };
    });
    setStories(updated);
  };

  const handleRequestEvidence = (claimId: string) => {
    const updated = stories.map((s) => {
      if (s.storyId !== activeStory.storyId) return s;
      return {
        ...s,
        claims: s.claims.map((c) => {
          if (c.claimId !== claimId) return c;
          return {
            ...c,
            evidence: [
              ...c.evidence,
              {
                evidenceId: `ev-${Date.now()}`,
                claimId,
                type: "SUPPORTING" as const,
                description:
                  "Supplementary fact-check evidence retrieved by AGT-019 Source Credibility Assessor.",
                source: "Cross-Media Registry (AGT-013-CROSS)",
                reliability: 0.95,
              },
            ],
          };
        }),
      };
    });
    setStories(updated);
  };

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="h-96 animate-pulse rounded-lg border border-[#2E2E32] bg-[#12121A] lg:col-span-1" />
        <div className="h-96 animate-pulse rounded-lg border border-[#2E2E32] bg-[#12121A] lg:col-span-3" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Truth Verification Workspace
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
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
            Verification Queue Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach ContentFactoryService via BFF."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#CF2020]/80 transition-colors"
          >
            Retry Verification Queue
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && stories.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Truth Verification Workspace
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No stories awaiting verification
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            All detected stories have either been verified and routed to the Content Factory or returned to origination.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setStories(SAMPLE_VERIFICATION_STORIES);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Verification Queue
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Truth Verification &amp; Claim Fact-Checking Workspace
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Verify extracted claims, inspect evidence ledgers, and check misinformation &amp; bias scores
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Main split view: Left story selector (1 col), Right verification workspace (3 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Panel: Story Selector Queue */}
        <aside className="space-y-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Queue ({stories.length} stories)
          </h3>
          <div className="space-y-2">
            {stories.map((s) => {
              const isSelected = s.storyId === activeStory.storyId;
              return (
                <div
                  key={s.storyId}
                  onClick={() => setSelectedStoryId(s.storyId)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-[#0066CC] bg-[#0A0A0B] shadow"
                      : "border-[#2E2E32] bg-[#12121A]/80 hover:border-[#2E2E32]/90"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#3399FF]">
                      {s.sourceName}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        s.confidence.tier === "VERIFIED_TRUTH"
                          ? "bg-[#0D9040]/20 text-[#0D9040]"
                          : "bg-[#3399FF]/20 text-[#3399FF]"
                      }`}
                    >
                      {(s.confidence.overallConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h4 className="line-clamp-2 text-xs font-bold text-[#FAFAFA]">
                    {s.headline}
                  </h4>
                  <div className="mt-2 text-[10px] text-[#A0A4A8]">
                    {s.claims.length} claim(s) · {new Date(s.detectedAt).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Panel: Verification Panel */}
        <main className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 lg:col-span-3">
          <VerificationPanel
            storyTitle={activeStory.headline}
            claims={activeStory.claims}
            misinfo={activeStory.misinfo}
            bias={activeStory.bias}
            confidence={activeStory.confidence}
            onVerifyStory={handleVerifyStory}
            onDisputeClaim={handleDisputeClaim}
            onRequestEvidence={handleRequestEvidence}
            onRouteToFactory={() => router.push("/newsroom/factory")}
            onRouteToOrigination={() => router.push("/newsroom/origination")}
          />
        </main>
      </div>
    </div>
  );
}

interface SimulationToolbarProps {
  currentMode: "normal" | "loading" | "empty" | "error";
  onSelectMode: (mode: "normal" | "loading" | "empty" | "error") => void;
}

function SimulationToolbar({ currentMode, onSelectMode }: SimulationToolbarProps): React.JSX.Element {
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
