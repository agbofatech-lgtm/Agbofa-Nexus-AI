import { adaptPhase1Foundation } from "@/lib/adapters/phase1-foundation";
import { phase1FoundationFixture } from "@/lib/mocks/phase1-foundation";
import type { DataState } from "@/types/data-state";
import type { Phase2FoundationSnapshot } from "@/types/phase2";
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
const validatedFoundation = adaptPhase1Foundation(phase1FoundationFixture);

export const phase1FoundationService = {
  snapshot(): DataState<Phase2FoundationSnapshot> {
    return validatedFoundation;
  },
  async getFoundation(
    signal?: AbortSignal,
  ): Promise<DataState<Phase2FoundationSnapshot>> {
    await delay(180, signal);
    return validatedFoundation;
  },
};
