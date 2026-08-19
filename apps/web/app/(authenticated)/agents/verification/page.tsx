import { AgentCategoryView } from "@/components/features/agents/AgentCategoryView";

export default function VerificationAgentsPage() {
  return (
    <AgentCategoryView
      categories={["verification"]}
      description="Canonical verification, safety, originality, quality, and bias agents."
      discrepancyNote="The authoritative registry defines five Verification agents: AGT-008–012. This route preserves the requested URL without inventing additional IDs or names."
      title="Verification Agents"
    />
  );
}
