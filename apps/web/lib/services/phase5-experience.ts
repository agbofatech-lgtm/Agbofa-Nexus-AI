import { adaptPhase5Experience } from "@/lib/adapters/phase5-experience";
import { mockAgents } from "@/lib/mocks/agents";
import { mockAIControlData } from "@/lib/mocks/ai-control";
import { growthIntelligenceFixture } from "@/lib/mocks/growth-intelligence";
import { phase3ExperienceFixture } from "@/lib/mocks/phase3-experience";
import { phase5ExperienceFixture } from "@/lib/mocks/phase5-experience";
import { strategyDirectorFixture } from "@/lib/mocks/strategy-director";
import type { DataState } from "@/types/data-state";
import type { Phase5ExperienceData } from "@/types/phase5-experience";

const validatedPhase5Workspace = adaptPhase5Experience(
  phase5ExperienceFixture,
  {
    agents: mockAgents,
    growth: growthIntelligenceFixture,
    phase3: phase3ExperienceFixture,
    strategy: strategyDirectorFixture,
    aiControl: mockAIControlData,
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

export const phase5ExperienceService = {
  async getWorkspace(
    signal?: AbortSignal,
  ): Promise<DataState<Phase5ExperienceData>> {
    await delay(420, signal);
    return validatedPhase5Workspace;
  },
};
