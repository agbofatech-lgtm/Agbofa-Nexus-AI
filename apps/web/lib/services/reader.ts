import { mockStories } from "@/lib/mocks/stories";
import type { FeedOptions, FeedResponse, Story } from "@/types/reader";

const MOCK_DELAY_MS = 620;
const CURSOR_PREFIX = "nexus-feed:";
const simulatedFailures = new Set<string>();

function delay(duration: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request aborted", "AbortError"));
      return;
    }

    const timer = window.setTimeout(resolve, duration);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function parseCursor(cursor: string | null): number {
  if (!cursor) return 0;
  if (!cursor.startsWith(CURSOR_PREFIX)) return 0;
  const parsed = Number.parseInt(cursor.slice(CURSOR_PREFIX.length), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function includesSearch(story: Story, search: string): boolean {
  const haystack = [
    story.headline,
    story.summary,
    story.category,
    story.source,
    story.author ?? "",
    ...(story.entities?.people ?? []),
    ...(story.entities?.organizations ?? []),
    ...(story.entities?.locations ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(search);
}

export const readerService = {
  async getFeed(options: FeedOptions): Promise<FeedResponse> {
    await delay(MOCK_DELAY_MS, options.signal);

    const normalizedSearch = options.search.trim().toLowerCase();
    if (
      normalizedSearch === "simulate-error" &&
      !simulatedFailures.has(normalizedSearch)
    ) {
      simulatedFailures.add(normalizedSearch);
      throw new Error(
        "Failed to load feed. The mock reader service is unavailable.",
      );
    }

    let stories = [...mockStories];

    if (options.filters.topic) {
      stories = stories.filter(
        (story) => story.category === options.filters.topic,
      );
    }

    if (options.filters.source) {
      stories = stories.filter(
        (story) => story.source === options.filters.source,
      );
    }

    if (normalizedSearch) {
      stories = stories.filter((story) =>
        includesSearch(story, normalizedSearch),
      );
    }

    switch (options.sort) {
      case "latest":
        stories.sort(
          (first, second) =>
            second.publishedAt.getTime() - first.publishedAt.getTime(),
        );
        break;
      case "trending":
        stories.sort(
          (first, second) =>
            second.trendScore - first.trendScore ||
            second.confidence - first.confidence,
        );
        break;
      case "confidence":
        stories.sort(
          (first, second) =>
            second.confidence - first.confidence ||
            second.publishedAt.getTime() - first.publishedAt.getTime(),
        );
        break;
    }

    const limit = Math.min(Math.max(options.limit ?? 10, 1), 24);
    const start = parseCursor(options.cursor);
    const end = Math.min(start + limit, stories.length);
    const hasMore = end < stories.length;

    return {
      stories: stories.slice(start, end),
      featured: stories[0] ?? null,
      nextCursor: hasMore ? `${CURSOR_PREFIX}${end}` : null,
      hasMore,
      total: stories.length,
    };
  },
};
