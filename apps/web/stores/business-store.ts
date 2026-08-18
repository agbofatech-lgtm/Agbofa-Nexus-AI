import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { BusinessModules } from "@/types/business";
import type { DataState } from "@/types/data-state";

export type BusinessModuleKey = keyof BusinessModules;

type ModuleData = BusinessModules[BusinessModuleKey];

const loadingState = <T>(source: string): DataState<T> => ({
  data: null,
  state: "loading",
  source,
  lastUpdated: null,
  error: null,
  isDemo: false,
});

interface BusinessState {
  modules: BusinessModules;
  setModule: (key: BusinessModuleKey, value: ModuleData) => void;
  setModuleLoading: (key: BusinessModuleKey) => void;
  setModuleError: (key: BusinessModuleKey, error: string) => void;
}

export const useBusinessStore = create<BusinessState>()(
  devtools(
    (set) => ({
      modules: {
        distribution: loadingState("Distribution adapter"),
        growth: loadingState("Growth adapter"),
        monetization: loadingState("Monetization adapter"),
        analytics: loadingState("Analytics adapter"),
        admin: loadingState("Administration adapter"),
        aiCost: loadingState("AI cost adapter"),
      },
      setModule: (key, value) =>
        set(
          (state) => ({
            modules: { ...state.modules, [key]: value } as BusinessModules,
          }),
          false,
          `business/data/${key}`,
        ),
      setModuleLoading: (key) =>
        set(
          (state) => ({
            modules: {
              ...state.modules,
              [key]: { ...state.modules[key], state: "loading", error: null },
            } as BusinessModules,
          }),
          false,
          `business/loading/${key}`,
        ),
      setModuleError: (key, error) =>
        set(
          (state) => ({
            modules: {
              ...state.modules,
              [key]: { ...state.modules[key], state: "error", error },
            } as BusinessModules,
          }),
          false,
          `business/error/${key}`,
        ),
    }),
    {
      name: "AgbofaBusinessStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
