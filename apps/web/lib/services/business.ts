import { demoBusinessModules } from "@/lib/mocks/business";
import type { BusinessModules } from "@/types/business";
import { unavailableDataState, type DataState } from "@/types/data-state";

export type BusinessModuleKey = keyof BusinessModules;

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

export const businessService = {
  async getModule<K extends BusinessModuleKey>(
    key: K,
    signal?: AbortSignal,
  ): Promise<BusinessModules[K]> {
    await delay(
      360 + Object.keys(demoBusinessModules).indexOf(key) * 25,
      signal,
    );
    return demoBusinessModules[key];
  },

  unavailable<T>(source: string): DataState<T> {
    return unavailableDataState<T>(source);
  },
};
