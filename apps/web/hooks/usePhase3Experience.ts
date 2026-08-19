"use client";

import { useCallback, useEffect, useState } from "react";
import { phase3ExperienceService } from "@/lib/services/phase3-experience";
import type { DataState } from "@/types/data-state";
import type { Phase3ExperienceData } from "@/types/phase3-experience";

export function usePhase3Experience() {
  const [value, setValue] = useState<DataState<Phase3ExperienceData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void phase3ExperienceService
      .getWorkspace(controller.signal)
      .then(setValue)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Phase 3 experience unavailable.",
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
