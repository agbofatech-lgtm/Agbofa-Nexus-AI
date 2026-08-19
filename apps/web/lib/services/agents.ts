import { mockAgents } from "@/lib/mocks/agents";
import type { Agent } from "@/types/agents";

const simulatedFailures = new Set<string>();

export class AgentNotFoundError extends Error {
  constructor(agentId: string) {
    super(`Agent ${agentId} was not found in the canonical registry.`);
    this.name = "AgentNotFoundError";
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

export const agentService = {
  async getAgents(signal?: AbortSignal): Promise<Agent[]> {
    await delay(480, signal);
    return [...mockAgents];
  },

  async getAgent(agentId: string, signal?: AbortSignal): Promise<Agent> {
    await delay(360, signal);
    const normalizedId = agentId.toUpperCase();
    if (
      normalizedId === "SIMULATE-ERROR" &&
      !simulatedFailures.has(normalizedId)
    ) {
      simulatedFailures.add(normalizedId);
      throw new Error("The simulated agent runtime adapter was interrupted.");
    }
    const agent =
      normalizedId === "SIMULATE-ERROR"
        ? mockAgents[0]
        : mockAgents.find((candidate) => candidate.id === normalizedId);
    if (!agent) throw new AgentNotFoundError(agentId);
    return agent;
  },
};
