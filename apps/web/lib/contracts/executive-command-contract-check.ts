import { executiveCommandService } from "@/lib/services/executive-command";
import type { ExecutiveCommandData } from "@/types/executive-command";

export const executiveCommandContractCheck =
  executiveCommandService.snapshot().data satisfies ExecutiveCommandData | null;

export const phase6ExecutionBoundary = {
  realAutonomousExecution: 0,
  realAgentOrchestration: 0,
  realTaskDispatch: 0,
  realPublishing: 0,
  realDistribution: 0,
  realProviderRouting: 0,
  realMemoryPersistence: 0,
  realScenarioExecution: 0,
  realFinancialExecution: 0,
  realExternalMutation: 0,
  frontendNetworkCalls: 0,
  agentsBeyondCanonicalRegistry: 0,
} as const;
