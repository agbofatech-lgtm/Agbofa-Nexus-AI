import { mockStories } from "@/lib/mocks/stories";
import type { StoryDetail } from "@/types/story";

const simulatedFailures = new Set<string>();

export class StoryNotFoundError extends Error {
  constructor(storyId: string) {
    super(`Story ${storyId} was not found.`);
    this.name = "StoryNotFoundError";
  }
}

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

function resolveStory(id: string): StoryDetail | undefined {
  if (id === "simulate-error") return mockStories[0];
  return mockStories.find((story) => story.id === id);
}

function overlappingEntities(first: StoryDetail, second: StoryDetail): number {
  const firstEntities = new Set([
    ...(first.entities?.people ?? []),
    ...(first.entities?.organizations ?? []),
    ...(first.entities?.locations ?? []),
  ]);
  return [
    ...(second.entities?.people ?? []),
    ...(second.entities?.organizations ?? []),
    ...(second.entities?.locations ?? []),
  ].filter((entity) => firstEntities.has(entity)).length;
}

export const storyService = {
  async getStory(id: string, signal?: AbortSignal): Promise<StoryDetail> {
    await delay(430, signal);

    if (id === "simulate-error" && !simulatedFailures.has(id)) {
      simulatedFailures.add(id);
      throw new Error("The story intelligence service was interrupted.");
    }

    const story = resolveStory(id);
    if (!story) throw new StoryNotFoundError(id);
    return story;
  },

  async getRelatedStories(
    id: string,
    limit = 6,
    signal?: AbortSignal,
  ): Promise<StoryDetail[]> {
    await delay(280, signal);
    const story = resolveStory(id);
    if (!story) return [];

    const boundedLimit = Math.min(Math.max(limit, 3), 6);
    return mockStories
      .filter((candidate) => candidate.id !== story.id)
      .map((candidate) => ({
        candidate,
        score:
          (candidate.category === story.category ? 10 : 0) +
          overlappingEntities(story, candidate) * 3 +
          candidate.confidence / 100 +
          candidate.trendScore / 200,
      }))
      .filter(({ score }) => score > 1)
      .sort(
        (first, second) =>
          second.score - first.score ||
          second.candidate.publishedAt.getTime() -
            first.candidate.publishedAt.getTime(),
      )
      .slice(0, boundedLimit)
      .map(({ candidate }) => candidate);
  },
};
