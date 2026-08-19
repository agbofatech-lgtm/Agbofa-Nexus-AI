import { strategyDirectorFixture } from "@/lib/mocks/strategy-director";
import type { StrategyDirectorFixture } from "@/types/strategy-director";

export const strategyDirectorContractCheck =
  strategyDirectorFixture satisfies StrategyDirectorFixture;

export const phase4ExecutionBoundary = {
  realStrategyExecution: 0,
  realAgentOrchestration: 0,
  realTaskDispatch: 0,
  realApprovalExecution: 0,
  realOverrideExecution: 0,
  realExternalMutation: 0,
  frontendNetworkCalls: 0,
} as const;
