import { mockPersonalizationIntelligence } from "@/lib/mocks/personalization-intelligence";
import type { PersonalizationIntelligenceData } from "@/types/personalization-intelligence";

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

export const personalizationIntelligenceService = {
  async getDashboard(
    signal?: AbortSignal,
  ): Promise<PersonalizationIntelligenceData> {
    await delay(380, signal);
    return mockPersonalizationIntelligence;
  },
};
