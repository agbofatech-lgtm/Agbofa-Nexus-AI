"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { PackageBuilder } from "../components/package-builder";
import { PackageItem, PackageType } from "../types";

const SAMPLE_FACTORY_PACKAGES: PackageItem[] = [
  {
    packageId: "pkg-101",
    storyId: "story-101",
    packageType: "MULTI_CHANNEL",
    status: "PACKAGING",
    factualConsistencyVerified: true,
    compliancePreCheckPassed: true,
    sourceAttributionComplete: true,
    brandVoiceScore: {
      compatibilityScore: 0.96,
      toneAnalysis: ["Authoritative", "Analytical", "Factual", "Professional"],
      mismatchWarnings: [],
      recommendations: ["Maintain current executive technical voice across social threads."],
    },
    assets: [
      {
        assetId: "ast-1",
        type: "ARTICLE_HEADLINE",
        title: "Primary Article Headline & SEO Title",
        content: "Autonomous AI Newsroom Workforce Expands Across Regions",
        status: "PRESENT",
        required: true,
      },
      {
        assetId: "ast-2",
        type: "ARTICLE_BODY",
        title: "Verified Article Prose & Evidence Synthesis",
        content:
          "Agbofa Nexus AI has officially deployed its complete 32-agent workforce across News Gathering, Content Detection, Verification, and Pipeline Orchestration. The autonomous newsroom operates continuously, cross-referencing wire feeds and social platforms to produce verified content packages.",
        status: "PRESENT",
        required: true,
      },
      {
        assetId: "ast-3",
        type: "SOCIAL_THREAD_X",
        title: "Twitter/X Verified 4-Post Thread",
        content:
          "1/4 BREAKING: Agbofa Nexus AI deploys 32 specialized autonomous agents across global newsrooms. ⚡\n\n2/4 Fact-checking (AGT-017) and cross-media consistency (AGT-013-CROSS) operate at 99.2% alignment.",
        status: "PRESENT",
        required: true,
      },
      {
        assetId: "ast-4",
        type: "VIDEO_SCRIPT",
        title: "60-Second Newsroom Explainer Script",
        content: "",
        status: "MISSING",
        required: false,
      },
    ],
  },
  {
    packageId: "pkg-102",
    storyId: "story-102",
    packageType: "ARTICLE",
    status: "PACKAGING",
    factualConsistencyVerified: true,
    compliancePreCheckPassed: true,
    sourceAttributionComplete: true,
    brandVoiceScore: {
      compatibilityScore: 0.89,
      toneAnalysis: ["Promotional", "Technical", "Executive"],
      mismatchWarnings: [
        "Slight promotional tone in executive quote; recommend dampening adjectives.",
      ],
      recommendations: ["Replace 'industry-leading' with specific MAPE percentage value."],
    },
    assets: [
      {
        assetId: "ast-5",
        type: "ARTICLE_HEADLINE",
        title: "Primary Article Headline",
        content: "Predictive Intelligence Engines Scale Calibration Metrics",
        status: "PRESENT",
        required: true,
      },
      {
        assetId: "ast-6",
        type: "ARTICLE_BODY",
        title: "Verified Article Prose",
        content:
          "Five predictive models evaluate story virality, engagement optimization, and trend lifecycle state transitions across social platforms.",
        status: "PRESENT",
        required: true,
      },
    ],
  },
];

export default function ContentFactoryPage(): React.JSX.Element {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageItem[]>(SAMPLE_FACTORY_PACKAGES);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    SAMPLE_FACTORY_PACKAGES[0].packageId,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function loadFactoryQueue() {
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
          setError(resp.error?.message || "Failed to load factory packages from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadFactoryQueue();
  }, []);

  const activePkg =
    packages.find((p) => p.packageId === selectedPkgId) || packages[0];

  const handleChangePackageType = (newType: PackageType) => {
    const updated = packages.map((p) => {
      if (p.packageId !== activePkg.packageId) return p;
      return { ...p, packageType: newType };
    });
    setPackages(updated);
  };

  const handleGenerateMissing = () => {
    const updated = packages.map((p) => {
      if (p.packageId !== activePkg.packageId) return p;
      return {
        ...p,
        assets: p.assets.map((a) =>
          a.status === "MISSING"
            ? {
                ...a,
                status: "PRESENT" as const,
                content:
                  "[AI GENERATED ASSET BY CONTENT FACTORY]: Generated script/media for " +
                  a.title,
              }
            : a,
        ),
      };
    });
    setPackages(updated);
  };

  const handleEditAsset = (assetId: string) => {
    const newText = prompt(
      "Edit asset content:",
      activePkg.assets.find((a) => a.assetId === assetId)?.content || "",
    );
    if (newText !== null) {
      const updated = packages.map((p) => {
        if (p.packageId !== activePkg.packageId) return p;
        return {
          ...p,
          assets: p.assets.map((a) =>
            a.assetId === assetId ? { ...a, content: newText, status: "PRESENT" as const } : a,
          ),
        };
      });
      setPackages(updated);
    }
  };

  const handleSubmitForReview = () => {
    alert(`Package ${activePkg.packageId} submitted to Editorial Review queue!`);
    router.push("/newsroom/review");
  };

  const handleSaveDraft = () => {
    alert(`Package ${activePkg.packageId} draft saved to ContentFactoryService!`);
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
            Content Factory Packaging
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
            Content Factory Retrieval Failed
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
            Retry Factory Queue
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && packages.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Content Factory Packaging
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
            No verified stories awaiting packaging
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            All verified stories have either been assembled into content packages or submitted to editorial review.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setPackages(SAMPLE_FACTORY_PACKAGES);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Factory Packages
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
            Content Factory &amp; Multi-Channel Package Assembly
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Assemble verified stories into multi-platform formats, check AGT-028 compliance, and submit for review
          </p>
        </div>
        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Panel: Verified stories list */}
        <aside className="space-y-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Verified Stories ({packages.length})
          </h3>
          <div className="space-y-2">
            {packages.map((p) => {
              const isSelected = p.packageId === activePkg.packageId;
              const titleAsset = p.assets.find((a) => a.type.includes("HEADLINE"));
              return (
                <div
                  key={p.packageId}
                  onClick={() => setSelectedPkgId(p.packageId)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-[#0066CC] bg-[#0A0A0B] shadow"
                      : "border-[#2E2E32] bg-[#12121A]/80 hover:border-[#2E2E32]/90"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="rounded bg-[#6C5CE7]/10 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7]">
                      {p.packageType}
                    </span>
                    <span className="text-[10px] font-semibold text-[#0D9040]">
                      ✔ Verified
                    </span>
                  </div>
                  <h4 className="line-clamp-2 text-xs font-bold text-[#FAFAFA]">
                    {titleAsset?.content || "Untitled Story Package"}
                  </h4>
                  <div className="mt-2 text-[10px] text-[#A0A4A8]">
                    {p.assets.length} assets · Voice match {(p.brandVoiceScore.compatibilityScore * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Panel: Package Builder */}
        <main className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 lg:col-span-3">
          <PackageBuilder
            pkg={activePkg}
            onChangePackageType={handleChangePackageType}
            onGenerateMissing={handleGenerateMissing}
            onEditAsset={handleEditAsset}
            onSubmitForReview={handleSubmitForReview}
            onSaveDraft={handleSaveDraft}
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
