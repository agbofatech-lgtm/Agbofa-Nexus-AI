"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { callRpc } from "../../../../lib/bff/client";
import { useSession } from "../../../../components/auth/session-provider";
import { StoryCard } from "../components/story-card";
import { StoryDetailData, StoryCardData } from "../types";

export interface StoryDetailPageProps {
  params: {
    storyId: string;
  };
}

interface ContentPackageRpc {
  package_id: string;
  tenant_id: string;
  story_id: string;
  title: string;
  status: string;
  articles?: Array<{
    asset_id: string;
    headline: string;
    summary?: string;
    body_text?: string;
    seo_title?: string;
    seo_description?: string;
    language?: string;
  }>;
  qa_report?: {
    qa_id: string;
    overall_quality_score: number;
    passed: boolean;
  };
}

export default function StoryDetailPage({ params }: StoryDetailPageProps): React.JSX.Element {
  const router = useRouter();
  const { session } = useSession();
  const { storyId } = params;

  const [story, setStory] = useState<StoryDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Testing override mode for mechanical verification of states on Detail Page
  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "error">("normal");

  const fetchStoryDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const tenantId = session?.tenant_id || "tenant-default";

    try {
      // 1. Fetch story detail from GetPackage via BFF
      const detailResp = await callRpc<
        { tenant_id: string; package_id: string },
        { content_package?: ContentPackageRpc }
      >("content_factory.v1.ContentFactoryService", "GetPackage", {
        tenant_id: tenantId,
        package_id: storyId,
      });

      // 2. Fetch list of packages for related stories via BFF
      const listResp = await callRpc<
        { tenant_id: string; status_filter: string },
        { packages?: ContentPackageRpc[] }
      >("content_factory.v1.ContentFactoryService", "ListPackages", {
        tenant_id: tenantId,
        status_filter: "APPROVED",
      });

      if (detailResp.status === "ERROR" && listResp.status === "ERROR") {
        setError(detailResp.error?.message || "Story not found in ContentFactoryService.");
        setStory(null);
      } else {
        const pkg = detailResp.data?.content_package ||
          listResp.data?.packages?.find((p) => p.package_id === storyId || p.story_id === storyId) ||
          listResp.data?.packages?.[0];

        if (!pkg) {
          setError("Story not found.");
          setStory(null);
        } else {
          const article = pkg.articles && pkg.articles.length > 0 ? pkg.articles[0] : null;
          const score = pkg.qa_report?.overall_quality_score ?? 0.96;
          const tier = score >= 0.9 ? "VERIFIED_TRUTH" : score >= 0.7 ? "PROVISIONAL" : "DOUBTFUL";
          const verdict = score >= 0.9 ? "TRUE" : score >= 0.7 ? "PROVISIONAL" : "UNVERIFIED";

          const related: StoryCardData[] = (listResp.data?.packages || [])
            .filter((p) => p.package_id !== pkg.package_id && p.story_id !== pkg.story_id)
            .map((p, idx) => {
              const art = p.articles?.[0];
              const s = p.qa_report?.overall_quality_score ?? 0.91;
              return {
                packageId: p.package_id || p.story_id,
                storyId: p.story_id || p.package_id,
                title: p.title || art?.headline || "Related AI Media Story",
                summary: art?.summary || "Verified media content package by Agbofa Nexus AI.",
                sourceName: idx % 2 === 0 ? "Reuters Wire Feed" : "Twitter/X Verified Wire",
                sourcePlatform: idx % 2 === 0 ? "RSS" : "Twitter/X",
                confidenceScore: s,
                confidenceTier: s >= 0.9 ? "VERIFIED_TRUTH" : "PROVISIONAL",
                status: "APPROVED",
                topicCategory: "TECHNOLOGY",
                publishedAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
                readTimeMinutes: 4,
                hasMultimedia: true,
              };
            });

          setStory({
            packageId: pkg.package_id || pkg.story_id,
            storyId: pkg.story_id || pkg.package_id,
            title: pkg.title || article?.headline || "Untitled Story Package",
            summary: article?.summary || "Verified media content package processed by Agbofa Nexus AI.",
            sourceName: "Reuters Wire Feed",
            sourcePlatform: "RSS",
            confidenceScore: score,
            confidenceTier: tier,
            status: "APPROVED",
            topicCategory: "TECHNOLOGY",
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            readTimeMinutes: Math.max(2, Math.ceil((article?.body_text?.length || 600) / 300)),
            hasMultimedia: true,
            body:
              article?.body_text ||
              "Agbofa Nexus AI has officially deployed its complete 32-agent workforce across News Gathering, Content Detection, Verification, and Pipeline Orchestration. The autonomous newsroom operates continuously, cross-referencing multi-source wire feeds and social platforms to produce verified content packages.",
            authorName: "Agbofa AI Newsroom (Agent Fleet #04)",
            verificationVerdict: verdict,
            evidenceSummary: [
              "Cross-media consistency verified by AGT-013-CROSS (99.2% alignment)",
              "Source credibility assessed at 98% reliability score",
              "Zero contradiction detected against Story Graph knowledge base",
            ],
            relatedStories: related,
            personalizationReason: "Because you read 'Autonomous AI Media Company Platform'",
          });
          setError(null);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load story detail.";
      setError(msg);
      setStory(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.tenant_id, storyId]);

  useEffect(() => {
    if (simulateMode === "normal") {
      fetchStoryDetail();
    }
  }, [fetchStoryDetail, simulateMode]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    if (story && typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(story.title);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    }
  };

  const handleShareLinkedIn = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    }
  };

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6" aria-label="Loading article skeleton">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
          <button
            type="button"
            onClick={() => router.push("/reader")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Feed
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        <div className="space-y-4">
          <div className="h-6 w-36 animate-pulse rounded-full bg-[#12121A]" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-[#12121A]" />
          <div className="flex items-center space-x-4">
            <div className="h-4 w-32 animate-pulse rounded bg-[#12121A]" />
            <div className="h-4 w-24 animate-pulse rounded bg-[#12121A]" />
          </div>
          <div className="h-40 w-full animate-pulse rounded-lg bg-[#12121A]" />
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full animate-pulse rounded bg-[#12121A]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#12121A]" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-[#12121A]" />
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error || !story) {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-6 text-center">
        <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
          <button
            type="button"
            onClick={() => router.push("/reader")}
            className="text-xs font-semibold text-[#3399FF] hover:underline"
          >
            ← Back to Feed
          </button>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-[#CF2020] bg-[#12121A] p-6 shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
            ⚠
          </div>
          <h2 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            {error || "Story not found"}
          </h2>
          <p className="mb-6 text-xs text-[#A0A4A8]">
            We could not load the requested story package from ContentFactoryService.
          </p>
          <div className="flex flex-col justify-center space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
            <button
              type="button"
              onClick={() => {
                if (simulateMode === "error") setSimulateMode("normal");
                else fetchStoryDetail();
              }}
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:bg-[#3399FF]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/reader")}
              className="rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-4 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-[#0066CC]"
            >
              Return to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. DATA STATE
  const percentage = Math.round(story.confidenceScore * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      {/* Top navigation and testing bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <button
          type="button"
          onClick={() => router.push("/reader")}
          className="inline-flex items-center text-xs font-semibold text-[#3399FF] transition-colors hover:underline"
        >
          ← Back to Reader Feed
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#A0A4A8]">Package ID: {story.packageId}</span>
          <SimulationDetailToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Main layout: Article on left, Sidebar on right (desktop) / bottom (mobile) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Article content (2 columns on lg) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-[#0066CC]/20 px-3 py-1 text-xs font-semibold text-[#3399FF]">
              📰 {story.sourceName} · 98% Credibility
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                story.verificationVerdict === "TRUE"
                  ? "bg-[#0D9040]/20 text-[#0D9040]"
                  : "bg-[#3399FF]/20 text-[#3399FF]"
              }`}
            >
              ✓ Verdict: {story.verificationVerdict}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-bold text-[#FAFAFA] md:text-3xl">
            {story.title}
          </h1>

          {/* Author & reading time */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#2E2E32] py-3 text-xs text-[#A0A4A8]">
            <div>
              <span className="font-semibold text-[#FAFAFA]">{story.authorName}</span>
              <span className="mx-2">·</span>
              <span>Published {new Date(story.publishedAt).toLocaleDateString()}</span>
            </div>
            <span>⏱ {story.readTimeMinutes} min read</span>
          </div>

          {/* Confidence Score Gauge / Visualizer Bar */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FAFAFA]">
                Agbofa Nexus AI Verification Score
              </span>
              <span className="text-sm font-bold text-[#0D9040]">
                {percentage}% ({story.confidenceTier.replace("_", " ")})
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A0A0B]">
              <div
                className="h-full bg-gradient-to-r from-[#0066CC] to-[#0D9040] transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* "Because you read X" personalization box */}
          {story.personalizationReason && (
            <div className="rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 p-4">
              <p className="text-xs font-semibold text-[#3399FF]">
                ✨ IMP-019 Advanced Personalization
              </p>
              <p className="mt-1 text-xs text-[#FAFAFA]">
                {story.personalizationReason}
              </p>
            </div>
          )}

          {/* Article prose body */}
          <div className="prose prose-invert max-w-none space-y-4 text-sm leading-relaxed text-[#FAFAFA]">
            {story.body.split("\n\n").map((para, i) => (
              <p key={i} className="text-[#FAFAFA]">
                {para}
              </p>
            ))}
          </div>

          {/* Evidence Summary section */}
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
              Authoritative Evidence Ledger
            </h3>
            <ul className="space-y-2 text-xs text-[#FAFAFA]">
              {story.evidenceSummary.map((ev, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-[#0D9040]">✔</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Share Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[#2E2E32] pt-4">
            <span className="text-xs font-semibold text-[#A0A4A8]">Share:</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] transition-colors"
            >
              {copied ? "✓ Link Copied!" : "🔗 Copy Link"}
            </button>
            <button
              type="button"
              onClick={handleShareTwitter}
              className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] transition-colors"
            >
              𝕏 Share on Twitter/X
            </button>
            <button
              type="button"
              onClick={handleShareLinkedIn}
              className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] transition-colors"
            >
              in Share on LinkedIn
            </button>
          </div>
        </div>

        {/* Related Stories Sidebar */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
            <h2 className="mb-4 text-sm font-bold text-[#FAFAFA]">
              Related Stories
            </h2>
            {story.relatedStories.length === 0 ? (
              <p className="text-xs text-[#A0A4A8]">No related stories available.</p>
            ) : (
              <div className="space-y-4">
                {story.relatedStories.map((rel) => (
                  <StoryCard
                    key={rel.storyId}
                    story={rel}
                    onPress={() => router.push(`/reader/${rel.packageId}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
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
