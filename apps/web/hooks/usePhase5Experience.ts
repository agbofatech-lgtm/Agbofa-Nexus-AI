"use client";

import { useCallback, useEffect, useState } from "react";
import { phase5ExperienceService } from "@/lib/services/phase5-experience";
import type { DataState } from "@/types/data-state";
import type { Phase5ExperienceData } from "@/types/phase5-experience";

export function usePhase5Experience() {
  const [value, setValue] = useState<DataState<Phase5ExperienceData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void phase5ExperienceService
      .getWorkspace(controller.signal)
      .then(setValue)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error ? reason.message : "Phase 5 experience unavailable.",
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
    retry: useCallback(() => setRefreshKey((value) => value + 1), []),
  };
}
