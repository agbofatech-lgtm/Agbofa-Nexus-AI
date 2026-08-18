"use client";
import { useMemo } from "react";
import { distributionAdaptationService } from "@/lib/services/distribution-adaptation";
import type { DistributionChannel } from "@/types/business";
import type { PlatformPreviewData } from "@/types/distribution";
export function useDistributionAdaptation(
  content: string,
  channels: readonly DistributionChannel[],
): readonly PlatformPreviewData[] {
  return useMemo(
    () => distributionAdaptationService.preview(content, channels),
    [channels, content],
  );
}
