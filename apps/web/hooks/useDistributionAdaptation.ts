"use client";
import { useMemo } from "react";
import { distributionAdaptationService } from "@/lib/services/distribution-adaptation";
import type {
  DistributionPreviewTarget,
  PlatformPreviewData,
} from "@/types/distribution";
export function useDistributionAdaptation(
  content: string,
  channels: readonly DistributionPreviewTarget[],
): readonly PlatformPreviewData[] {
  return useMemo(
    () => distributionAdaptationService.preview(content, channels),
    [channels, content],
  );
}
