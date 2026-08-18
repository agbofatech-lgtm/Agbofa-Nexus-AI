"use client";

import { useCallback, useEffect, useState } from "react";

import { commandService } from "@/lib/services/command";
import type { CommandOverviewData } from "@/types/command";
import type { DataState } from "@/types/data-state";

interface CommandOverviewState {
  value: DataState<CommandOverviewData> | null;
  loading: boolean;
  error: string | null;
}

export function useCommandOverview() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<CommandOverviewState>({
    value: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    void commandService
      .getOverview(controller.signal)
      .then((value) => setState({ value, loading: false, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          value: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "The local command fixture could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [refreshKey]);

  const retry = useCallback(() => setRefreshKey((value) => value + 1), []);

  return { ...state, retry };
}
