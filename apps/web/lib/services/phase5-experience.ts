import { adaptPhase5Experience } from "@/lib/adapters/phase5-experience";
import { mockAgents } from "@/lib/mocks/agents";
import { mockAIControlData } from "@/lib/mocks/ai-control";
import { growthIntelligenceFixture } from "@/lib/mocks/growth-intelligence";
import { phase3ExperienceFixture } from "@/lib/mocks/phase3-experience";
import { phase5ExperienceFixture } from "@/lib/mocks/phase5-experience";
import { strategyDirectorFixture } from "@/lib/mocks/strategy-director";
import type { DataState } from "@/types/data-state";
import type { Phase5ExperienceData } from "@/types/phase5-experience";

export const validatedPhase5Workspace = adaptPhase5Experience(
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
  snapshot(): DataState<Phase5ExperienceData> {
    return validatedPhase5Workspace;
  },
  async getWorkspace(
    signal?: AbortSignal,
  ): Promise<DataState<Phase5ExperienceData>> {
    try {
      const response = await fetch("/api/v1/autonomy/control", { signal, cache: "no-store" });
      if (response.ok) {
        const live = (await response.json()) as { kill_switch?: string; global_level?: number };
        const next = structuredClone(validatedPhase5Workspace);
        if (next.data && live.kill_switch === "ENGAGED") {
          next.data.killSwitch = {
            ...next.data.killSwitch,
            state: "SIMULATED_STOP_APPLIED",
            backendEnforcement: "UNAVAILABLE",
            disclosure: "Kill-switch ENGAGED in backend for this tenant. Dispatch and Phase 04 schedule are blocked. Not OS process termination.",
          };
        }
        return next;
      }
    } catch {
      /* fall through to fixture */
    }
    await delay(420, signal);
    return validatedPhase5Workspace;
  },
};
