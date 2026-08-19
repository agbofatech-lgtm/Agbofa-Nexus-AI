import { adaptPhase3Experience } from "@/lib/adapters/phase3-experience";
import { mockAgents } from "@/lib/mocks/agents";
import { phase3ExperienceFixture } from "@/lib/mocks/phase3-experience";
import { mockStories } from "@/lib/mocks/stories";
import type { DataState } from "@/types/data-state";
import type { Phase3ExperienceData } from "@/types/phase3-experience";

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

const validatedPhase3Workspace = adaptPhase3Experience(
  phase3ExperienceFixture,
  { stories: mockStories, agents: mockAgents },
);

export const phase3ExperienceService = {
  snapshot(): DataState<Phase3ExperienceData> {
    return validatedPhase3Workspace;
  },
  async getWorkspace(
    signal?: AbortSignal,
  ): Promise<DataState<Phase3ExperienceData>> {
    await delay(360, signal);
    return validatedPhase3Workspace;
  },
};
