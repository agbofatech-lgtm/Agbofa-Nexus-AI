"use client";
import { useCallback, useEffect, useState } from "react";
import { phase1FoundationService } from "@/lib/services/phase1-foundation";
import type { DataState } from "@/types/data-state";
import type { Phase2FoundationSnapshot } from "@/types/phase2";
export function usePhase1Foundation() {
  const [value, setValue] =
    useState<DataState<Phase2FoundationSnapshot> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void phase1FoundationService
      .getFoundation(controller.signal)
      .then(setValue)
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
        setError(
          caught instanceof Error
            ? caught.message
            : "The Phase 1 foundation adapter is unavailable.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);
  const retry = useCallback(() => setRefreshKey((k) => k + 1), []);
  return { value, loading, error, retry };
}
