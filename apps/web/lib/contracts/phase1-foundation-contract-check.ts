import { createDataProvenance } from "@/types/data-state";
import type {
  AutonomousRun,
  GrowthOpportunity,
  Phase2FoundationSnapshot,
  StrategyPlan,
} from "@/types/phase2";
const unavailable = createDataProvenance(
  "unavailable",
  "Phase 1 reconstruction contract check",
  "Compile-time fixture only; no execution capability exists.",
);
export const opportunityContractCheck = {
  id: "contract-opportunity",
  title: "Contract fixture",
  summary: "Compile-time shape verification",
  source: "trend",
  status: "discovered",
  evidence: [],
  confidence: { score: 0, basis: "No evidence", kind: "estimate" },
  expectedImpact: {
    label: "Unavailable",
    value: null,
    unit: "score",
    provenance: unavailable,
  },
  estimatedCost: {
    amount: null,
    currency: "USD",
    basis: "Unavailable",
    provenance: unavailable,
  },
  risk: "guarded",
  recommendedAction: "Await an authorized implementation phase.",
  provenance: unavailable,
} satisfies GrowthOpportunity;
export const strategyContractCheck = {
  id: "contract-strategy",
  objective: "Compile contracts",
  situation: "Foundation reconstruction",
  status: "execution-unavailable",
  initiatives: [],
  confidence: { score: 0, basis: "No strategy engine", kind: "estimate" },
  approvalStatus: "draft",
  reality: "execution-unavailable",
  provenance: unavailable,
} satisfies StrategyPlan;
export const autonomousRunContractCheck = {
  id: "contract-run",
  objective: "Compile autonomous-run presentation",
  status: "execution-unavailable",
  progress: 0,
  agentIds: [],
  budget: {
    amount: null,
    currency: "USD",
    basis: "Unavailable",
    provenance: unavailable,
  },
  risk: "critical",
  autonomyLevel: 0,
  reality: "execution-unavailable",
} satisfies AutonomousRun;
export type Phase1FoundationContract = Phase2FoundationSnapshot;
