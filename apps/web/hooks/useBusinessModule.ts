"use client";

import { useCallback, useEffect, useState } from "react";

import {
  businessService,
  type BusinessModuleKey,
} from "@/lib/services/business";
import { useBusinessStore } from "@/stores/business-store";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useBusinessModule<K extends BusinessModuleKey>(key: K) {
  const value = useBusinessStore((state) => state.modules[key]);
  const setModule = useBusinessStore((state) => state.setModule);
  const setLoading = useBusinessStore((state) => state.setModuleLoading);
  const setError = useBusinessStore((state) => state.setModuleError);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(key);
    void businessService
      .getModule(key, controller.signal)
      .then((data) => setModule(key, data))
      .catch((error: unknown) => {
        if (!isAbort(error))
          setError(
            key,
            error instanceof Error ? error.message : "Data adapter failed.",
          );
      });
    return () => controller.abort();
  }, [key, refreshKey, setError, setLoading, setModule]);

  const retry = useCallback(() => setRefreshKey((value) => value + 1), []);
  return { value, retry };
}
