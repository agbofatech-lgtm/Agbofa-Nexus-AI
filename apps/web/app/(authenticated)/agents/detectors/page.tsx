import { AgentCategoryView } from "@/components/features/agents/AgentCategoryView";

export default function DetectorAgentsPage() {
  return (
    <AgentCategoryView
      categories={["content"]}
      description="Canonical Content agents presented in the preserved detector route."
      discrepancyNote="This route did not previously exist in the frontend. The checked-in registry defines seven Content agents (AGT-001–007), not AGT-009–016 as an IMP-017 detector group."
      title="Content & Detection Agents"
    />
  );
}
