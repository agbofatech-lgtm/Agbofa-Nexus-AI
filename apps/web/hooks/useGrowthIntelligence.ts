"use client";
import { useCallback, useEffect, useState } from "react";
import { growthIntelligenceService } from "@/lib/services/growth-intelligence";
import type { DataState } from "@/types/data-state";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export function useGrowthIntelligence() {
  const [value, setValue] = useState<DataState<GrowthIntelligenceData> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void growthIntelligenceService
      .getWorkspace(controller.signal)
      .then(setValue)
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(
          e instanceof Error ? e.message : "Growth Intelligence unavailable.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);
  return {
    value,
    data: value?.data ?? null,
    loading,
    error,
    retry: useCallback(() => setRefreshKey((k) => k + 1), []),
  };
}
