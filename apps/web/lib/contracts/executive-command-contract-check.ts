import { executiveCommandService } from "@/lib/services/executive-command";
import type { ExecutiveCommandData } from "@/types/executive-command";

export const executiveCommandContractCheck =
  executiveCommandService.snapshot().data satisfies ExecutiveCommandData | null;

if (!executiveCommandContractCheck) {
  throw new Error("Phase 06 executive snapshot is required.");
}
if (executiveCommandContractCheck.architectureVersion !== "phase-6-executive-command-v2") {
  throw new Error("Phase 06 executive contract version mismatch.");
}
if (executiveCommandContractCheck.workforce.registeredSource !== "FIXTURE") {
  throw new Error("Workforce count must remain labeled as fixture unless live telemetry exists.");
}
if (executiveCommandContractCheck.searchIndex.some((item) => item.mutates !== false)) {
  throw new Error("Command search must be side-effect free.");
}
if (executiveCommandContractCheck.governance.publishing.bypass) {
  throw new Error("Executive Command Center must not bypass Phase 04 publishing.");
}
if (executiveCommandContractCheck.governance.memoryPrivilege.canGrantRbac) {
  throw new Error("Memory must not grant RBAC.");
}
if (executiveCommandContractCheck.economics.costKind !== "ESTIMATED") {
  throw new Error("AI cost must remain ESTIMATED.");
}
if (executiveCommandContractCheck.governance.scenarios.kind !== "PROJECTED") {
  throw new Error("Scenarios must remain PROJECTED.");
}

export const phase6ExecutionBoundary = {
  realAutonomousExecution: 0,
  realAgentOrchestration: 0,
  realTaskDispatch: 0,
  realPublishing: 0,
  realDistribution: 0,
  realProviderRouting: 0,
  realMemoryPrivilege: 0,
  realScenarioExecution: 0,
  realFinancialExecution: 0,
  realExternalMutation: 0,
  commandSearchMutations: 0,
  killSwitchBypass: 0,
  brandingBypass: 0,
  snapshotNetworkCalls: 0,
} as const;
