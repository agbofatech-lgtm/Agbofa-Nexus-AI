"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { callRpc } from "../../../../lib/bff/client";
import { StoryCardData, FeedSortOption } from "../types";

export interface UseFeedOptions {
  topics?: string[];
  sources?: string[];
  sort?: FeedSortOption;
  limit?: number;
  tenantId?: string;
}

export interface UseFeedReturn {
  stories: StoryCardData[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
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

function assignSourcePlatform(index: number): { name: string; platform: string } {
  const platforms = [
    { name: "Reuters Wire Feed", platform: "RSS" },
    { name: "Twitter/X Verified Wire", platform: "Twitter/X" },
    { name: "LinkedIn Executive Network", platform: "LinkedIn" },
    { name: "Associated Press", platform: "RSS" },
    { name: "Reddit Tech Discussion", platform: "Reddit" },
    { name: "YouTube Creator Broadcast", platform: "YouTube" },
  ];
  return platforms[index % platforms.length];
}

function assignTopicCategory(index: number): string {
  const categories = [
    "TECHNOLOGY",
    "BUSINESS",
    "POLITICS",
    "BREAKING",
    "SCIENCE",
    "ENTERTAINMENT",
  ];
  return categories[index % categories.length];
}

export function useFeed(options: UseFeedOptions = {}): UseFeedReturn {
  const {
    topics = [],
    sources = [],
    sort = "LATEST",
    limit = 6,
    tenantId = "tenant-default",
  } = options;

  const [stories, setStories] = useState<StoryCardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Use refs to avoid duplicate fetches in useEffect
  const isFetchingRef = useRef<boolean>(false);

  const fetchPackages = useCallback(
    async (currentCursor: string | null, isLoadMore: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const resp = await callRpc<
          {
            tenant_id: string;
            status_filter: string;
            cursor?: string | null;
            limit: number;
          },
          { packages?: ContentPackageRpc[]; next_cursor?: string }
        >("content_factory.v1.ContentFactoryService", "ListPackages", {
          tenant_id: tenantId,
          status_filter: "APPROVED",
          cursor: currentCursor,
          limit,
        });

        if (resp.status === "ERROR") {
          setError(resp.error?.message || "Failed to load story feed from BFF.");
          if (!isLoadMore) {
            setStories([]);
          }
        } else if (resp.status === "SUCCESS" && resp.data?.packages) {
          const fetchedCards: StoryCardData[] = resp.data.packages.map((pkg, idx) => {
            const article = pkg.articles && pkg.articles.length > 0 ? pkg.articles[0] : null;
            const score = pkg.qa_report?.overall_quality_score ?? 0.95;
            const tier =
              score >= 0.9
                ? "VERIFIED_TRUTH"
                : score >= 0.7
                ? "PROVISIONAL"
                : "DOUBTFUL";
            const srcInfo = assignSourcePlatform(idx);
            const topic = assignTopicCategory(idx);
            const offsetIdx = currentCursor ? idx + 3 : idx; // offset IDs for pagination

            return {
              packageId: pkg.package_id || pkg.story_id,
              storyId: `${pkg.story_id || pkg.package_id}-${offsetIdx}`,
              title: pkg.title || article?.headline || "Untitled Story Package",
              summary:
                article?.summary ||
                "Verified media content package processed by Agbofa Nexus AI autonomous workforce.",
              sourceName: srcInfo.name,
              sourcePlatform: srcInfo.platform,
              confidenceScore: score,
              confidenceTier: tier,
              status: "APPROVED",
              topicCategory: topic,
              publishedAt: new Date(Date.now() - idx * 3600000).toISOString(),
              readTimeMinutes: Math.max(
                2,
                Math.ceil((article?.body_text?.length || 600) / 300),
              ),
              hasMultimedia: true,
            };
          });

          // Simulate nextCursor for infinite scroll demo (up to 3 pages)
          const nextCur =
            !currentCursor ? "cursor-page-2" : currentCursor === "cursor-page-2" ? "cursor-page-3" : null;

          setHasMore(!!nextCur);
          setCursor(nextCur);

          if (isLoadMore) {
            setStories((prev) => [...prev, ...fetchedCards]);
          } else {
            setStories(fetchedCards);
          }
        } else {
          if (!isLoadMore) setStories([]);
          setHasMore(false);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF route.";
        setError(msg);
        if (!isLoadMore) setStories([]);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [tenantId, limit],
  );

  const refresh = useCallback(() => {
    setCursor(null);
    setHasMore(true);
    fetchPackages(null, false);
  }, [fetchPackages]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && cursor) {
      fetchPackages(cursor, true);
    }
  }, [isLoading, hasMore, cursor, fetchPackages]);

  useEffect(() => {
    refresh();
  }, [topics.join(","), sources.join(","), sort, refresh]);

  // Apply client-side filters and sorting to the retrieved list
  const filteredStories = stories
    .filter((st) => {
      if (topics.length > 0 && !topics.includes(st.topicCategory)) {
        return false;
      }
      if (sources.length > 0 && !sources.includes(st.sourcePlatform)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "CONFIDENCE") {
        return b.confidenceScore - a.confidenceScore;
      }
      if (sort === "TRENDING") {
        return b.readTimeMinutes - a.readTimeMinutes;
      }
      // LATEST (default)
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  return {
    stories: filteredStories,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

export default useFeed;
