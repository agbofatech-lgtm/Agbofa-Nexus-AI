"use client";

import { useMemo } from "react";

import { readerService } from "@/lib/services/reader";

export function useReaderSources(): readonly string[] {
  return useMemo(() => readerService.getSources(), []);
}
