"use client";

import { useCallback, useEffect, useState } from "react";
import { executiveCommandService } from "@/lib/services/executive-command";
import type { DataState } from "@/types/data-state";
import type { ExecutiveCommandData } from "@/types/executive-command";

export function useExecutiveCommand() {
  const [value, setValue] = useState<DataState<ExecutiveCommandData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void executiveCommandService
      .getWorkspace(controller.signal)
      .then(setValue)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Executive command projection unavailable.",
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
