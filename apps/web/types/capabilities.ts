import type { DataProvenance } from "@/types/data-state";
import type {
  ExecutionFeatureFlag,
  FrontendFeatureFlag,
} from "@/types/feature-flags";

export type CapabilityState =
  | "available"
  | "unavailable"
  | "simulated"
  | "blocked"
  | "requiresAuthorization"
  | "comingSoon";
export type ExecutionReality =
  "experience" | "simulation" | "execution-unavailable";

export interface FrontendCapability {
  id: string;
  label: string;
  description: string;
  state: CapabilityState;
  reality: ExecutionReality;
  provenance: DataProvenance;
  featureFlag?: FrontendFeatureFlag;
  executionFlag?: ExecutionFeatureFlag;
  dependency?: string;
}
