import { mockPredictiveData } from "@/lib/mocks/predictive";
import type { PredictiveIntelligenceData } from "@/types/predictive";

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

export const predictiveService = {
  async getDashboard(
    signal?: AbortSignal,
  ): Promise<PredictiveIntelligenceData> {
    await delay(440, signal);
    return mockPredictiveData;
  },
};
