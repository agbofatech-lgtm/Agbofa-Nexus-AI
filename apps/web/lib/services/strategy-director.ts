import { adaptStrategyDirector } from "@/lib/adapters/strategy-director";
import { mockAgents } from "@/lib/mocks/agents";
import { growthIntelligenceFixture } from "@/lib/mocks/growth-intelligence";
import { phase3ExperienceFixture } from "@/lib/mocks/phase3-experience";
import { strategyDirectorFixture } from "@/lib/mocks/strategy-director";
import { mockStories } from "@/lib/mocks/stories";
import type { DataState } from "@/types/data-state";
import type { StrategyDirectorData } from "@/types/strategy-director";

const validatedStrategyWorkspace = adaptStrategyDirector(
  strategyDirectorFixture,
  {
    agents: mockAgents,
    stories: mockStories,
    growth: growthIntelligenceFixture,
    phase3: phase3ExperienceFixture,
  },
);

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

export const strategyDirectorService = {
  async getWorkspace(
    signal?: AbortSignal,
  ): Promise<DataState<StrategyDirectorData>> {
    await delay(400, signal);
    return validatedStrategyWorkspace;
  },
};
