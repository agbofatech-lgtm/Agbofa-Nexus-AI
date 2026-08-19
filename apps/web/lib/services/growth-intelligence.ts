import { adaptGrowthIntelligence } from "@/lib/adapters/growth-intelligence";
import { mockAgents } from "@/lib/mocks/agents";
import { growthIntelligenceFixture } from "@/lib/mocks/growth-intelligence";
import { mockStories } from "@/lib/mocks/stories";
import type { DataState } from "@/types/data-state";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException("Aborted", "AbortError"));
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
const validatedGrowthWorkspace = adaptGrowthIntelligence(
  growthIntelligenceFixture,
  { stories: mockStories, agents: mockAgents },
);

export const growthIntelligenceService = {
  snapshot(): DataState<GrowthIntelligenceData> {
    return validatedGrowthWorkspace;
  },
  async getWorkspace(
    signal?: AbortSignal,
  ): Promise<DataState<GrowthIntelligenceData>> {
    await delay(420, signal);
    return validatedGrowthWorkspace;
  },
};
