import { adaptDistributionContent } from "@/lib/adapters/distribution-templates";
import type {
  DistributionPreviewTarget,
  PlatformPreviewData,
} from "@/types/distribution";
export const distributionAdaptationService = {
  preview(
    content: string,
    channels: readonly DistributionPreviewTarget[],
  ): PlatformPreviewData[] {
    return adaptDistributionContent(content, channels);
  },
};
