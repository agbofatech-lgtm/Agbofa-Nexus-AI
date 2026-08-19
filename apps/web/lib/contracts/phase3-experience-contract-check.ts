import { phase3ExperienceFixture } from "@/lib/mocks/phase3-experience";
import type { Phase3ExperienceData } from "@/types/phase3-experience";

export const phase3ExperienceContractCheck =
  phase3ExperienceFixture satisfies Phase3ExperienceData;

export const phase3ExecutionBoundary = {
  frontendApiCalls: 0,
  realPublishing: 0,
  realDistribution: 0,
  realExperiments: 0,
  realAttributionBackend: 0,
  realAnalyticsBackend: 0,
} as const;
