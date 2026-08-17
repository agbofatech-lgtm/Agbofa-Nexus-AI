"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { truthService } from "@/lib/services/truth";
import { useTruthStore } from "@/stores/truth-store";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useTruth() {
  const state = useTruthStore();
  const requestSequence = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    const controller = new AbortController();
    state.setLoading("claims", true);
    state.setError(null);

    void truthService
      .getClaims(controller.signal)
      .then((claims) => {
        if (requestId === requestSequence.current) state.setClaims(claims);
      })
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || isAbortError(error))
          return;
        state.setError(
          error instanceof Error
            ? error.message
            : "Failed to load Truth Engine.",
        );
      })
      .finally(() => {
        if (requestId === requestSequence.current)
          state.setLoading("claims", false);
      });

    return () => controller.abort();
    // Store actions are stable; refreshKey intentionally drives retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const filteredClaims = useMemo(
    () =>
      state.statusFilter === "all"
        ? state.claims
        : state.claims.filter((claim) => claim.status === state.statusFilter),
    [state.claims, state.statusFilter],
  );
  const selectedClaim =
    filteredClaims.find((claim) => claim.id === state.selectedClaimId) ??
    filteredClaims[0] ??
    null;
  const retry = useCallback(() => setRefreshKey((key) => key + 1), []);

  return { ...state, filteredClaims, selectedClaim, retry };
}
