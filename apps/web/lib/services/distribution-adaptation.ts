import { adaptDistributionContent } from "@/lib/adapters/distribution-templates";
import type { DistributionChannel } from "@/types/business";
import type { PlatformPreviewData } from "@/types/distribution";
export const distributionAdaptationService = {
  preview(
    content: string,
    channels: readonly DistributionChannel[],
  ): PlatformPreviewData[] {
    return adaptDistributionContent(content, channels);
  },
};
