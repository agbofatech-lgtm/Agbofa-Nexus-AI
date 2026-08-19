import {
  executionFeatureFlags,
  frontendFeatureFlags,
} from "@/lib/config/feature-flags";
import type { Phase1FoundationFixture } from "@/lib/mocks/phase1-foundation";
import {
  createDataProvenance,
  demoDataState,
  type DataState,
} from "@/types/data-state";
import type { Phase2FoundationSnapshot } from "@/types/phase2";
export function adaptPhase1Foundation(
  fixture: Phase1FoundationFixture,
): DataState<Phase2FoundationSnapshot> {
  const provenance = createDataProvenance(
    "mock",
    fixture.source,
    fixture.detail,
  );
  const state = demoDataState<Phase2FoundationSnapshot>(
    {
      canonicalAgentCount: fixture.canonicalAgentCount,
      architectureVersion: fixture.architectureVersion,
      features: frontendFeatureFlags,
      execution: executionFeatureFlags,
      capabilities: fixture.capabilities.map((capability) => ({
        ...capability,
        provenance,
      })),
      provenance,
    },
    fixture.source,
  );
  return { ...state, provenance };
}
