"use client";

import { useEffect, useState } from "react";
import type { ExecutiveSearchRecord } from "@/types/executive-command";

export function useGlobalCommandSearch(query: string) {
  const [results, setResults] = useState<ExecutiveSearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    void import("@/lib/services/executive-command")
      .then(({ executiveCommandService }) => {
        if (active) setResults(executiveCommandService.search(normalized));
      })
      .catch(() => {
        if (active) {
          setResults([]);
          setError("Frontend search projection unavailable.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  return { results, loading, error };
}
