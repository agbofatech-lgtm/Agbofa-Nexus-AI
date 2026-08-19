import { demoDataState, type DataState } from "@/types/data-state";
import type { GrowthIntelligenceData } from "@/types/growth-intelligence";
interface Sources {
  stories: readonly { id: string; headline: string }[];
  agents: readonly { id: string; name: string }[];
}
export function adaptGrowthIntelligence(
  fixture: GrowthIntelligenceData,
  sources: Sources,
): DataState<GrowthIntelligenceData> {
  const stories = new Map(sources.stories.map((x) => [x.id, x]));
  const agents = new Map(sources.agents.map((x) => [x.id, x]));
  const trendIds = new Set(fixture.trends.map((x) => x.id));
  const opportunityIds = new Set(fixture.opportunities.map((x) => x.id));
  for (const gap of fixture.gaps) {
    if (!trendIds.has(gap.trendId) || !opportunityIds.has(gap.opportunityId))
      throw new Error(`Invalid Growth relationship: ${gap.id}`);
  }
  for (const dna of fixture.contentDNA) {
    if (!stories.has(dna.contentId))
      throw new Error(`Missing canonical story: ${dna.contentId}`);
  }
  for (const item of [...fixture.trends, ...fixture.opportunities]) {
    if (!agents.has(item.agent.agentId))
      throw new Error(`Missing canonical agent: ${item.agent.agentId}`);
  }
  const data = {
    ...fixture,
    contentDNA: fixture.contentDNA.map((x) => ({
      ...x,
      title: stories.get(x.contentId)?.headline ?? x.title,
    })),
    trends: fixture.trends.map((x) => ({
      ...x,
      agent: {
        ...x.agent,
        agentName: agents.get(x.agent.agentId)?.name ?? x.agent.agentName,
      },
    })),
    opportunities: fixture.opportunities.map((x) => ({
      ...x,
      agent: {
        ...x.agent,
        agentName: agents.get(x.agent.agentId)?.name ?? x.agent.agentName,
      },
    })),
  };
  const state = demoDataState(data, data.provenance.source);
  return {
    ...state,
    observedAt: new Date(data.metrics[0]?.observedAt ?? Date.now()),
    confidence: {
      score: 83,
      basis: "Aggregate simulated Growth Intelligence confidence",
      kind: "model",
    },
    provenance: data.provenance,
  };
}
