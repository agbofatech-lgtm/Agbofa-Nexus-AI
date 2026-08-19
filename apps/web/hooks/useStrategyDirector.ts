"use client";

import { useCallback, useEffect, useState } from "react";
import { strategyDirectorService } from "@/lib/services/strategy-director";
import type { DataState } from "@/types/data-state";
import type { StrategyDirectorData } from "@/types/strategy-director";

export function useStrategyDirector() {
  const [value, setValue] = useState<DataState<StrategyDirectorData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void strategyDirectorService
      .getWorkspace(controller.signal)
      .then(setValue)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Strategy Director unavailable.",
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
