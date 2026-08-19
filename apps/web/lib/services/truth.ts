import { mockClaims } from "@/lib/mocks/truth";
import type { Claim } from "@/types/truth";

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

export const truthService = {
  async getClaims(signal?: AbortSignal): Promise<Claim[]> {
    await delay(520, signal);
    return [...mockClaims];
  },
};
