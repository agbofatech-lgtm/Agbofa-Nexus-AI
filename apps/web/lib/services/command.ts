import { demoCommandOverview } from "@/lib/mocks/command";
import type { CommandOverviewData } from "@/types/command";
import type { DataState } from "@/types/data-state";

const DEMO_LATENCY_MS = 280;

function delay(duration: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, duration);
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

export const commandService = {
  async getOverview(signal?: AbortSignal): Promise<DataState<CommandOverviewData>> {
    await delay(DEMO_LATENCY_MS, signal);
    return demoCommandOverview;
  },
};
