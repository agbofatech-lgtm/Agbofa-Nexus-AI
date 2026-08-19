import { phase5ExperienceFixture } from "@/lib/mocks/phase5-experience";
import type { Phase5ExperienceFixture } from "@/types/phase5-experience";

export const phase5ExperienceContractCheck =
  phase5ExperienceFixture satisfies Phase5ExperienceFixture;

export const phase5ExecutionBoundary = {
  realAutonomousExecution: 0,
  realAgentOrchestration: 0,
  realTaskDispatch: 0,
  realApprovalExecution: 0,
  realOverrideExecution: 0,
  realKillSwitchEnforcement: 0,
  realExternalMutation: 0,
  realProviderRouting: 0,
  realMemoryPersistence: 0,
  realScenarioExecution: 0,
  realFinancialExecution: 0,
  frontendNetworkCalls: 0,
  agentsBeyondCanonicalRegistry: 0,
} as const;
