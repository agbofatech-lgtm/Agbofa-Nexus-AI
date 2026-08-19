import { growthIntelligenceFixture } from "@/lib/mocks/growth-intelligence";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
export const growthIntelligenceContractCheck =
  growthIntelligenceFixture satisfies GrowthIntelligenceData;
export const canonicalGrowthAgentIds = [
  "AGT-001",
  "AGT-019",
  "AGT-020",
] as const;
