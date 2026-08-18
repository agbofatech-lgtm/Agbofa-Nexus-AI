import { mockAIControlData } from "@/lib/mocks/ai-control";
import type { AIControlData } from "@/types/ai-control";

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
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

export const aiControlService = {
  async getDashboard(signal?: AbortSignal): Promise<AIControlData> {
    await delay(410, signal);
    return mockAIControlData;
  },
};
