import { AgentCategoryView } from "@/components/features/agents/AgentCategoryView";

export default function PipelineAgentsPage() {
  return (
    <AgentCategoryView
      categories={["distribution", "platform"]}
      description="Canonical distribution and platform agents shown in the preserved pipeline route."
      discrepancyNote="The repository has no authoritative Pipeline subgroup. This reconciled view contains AGT-013–016 (Distribution) and AGT-025–028 (Platform), and labels all relationships as simulated."
      title="Distribution & Platform Pipeline"
    />
  );
}
