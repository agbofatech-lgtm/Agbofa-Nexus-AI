import type {
  DataAvailability,
  DataConfidence,
  DataProvenance,
} from "@/types/data-state";
import type {
  CostEstimate,
  ExpectedImpact,
  GrowthOpportunity,
  RiskLevel,
} from "@/types/phase2";

export interface GrowthMeta {
  dataSource: "mock";
  availability: DataAvailability;
  observedAt: string;
  confidence: DataConfidence;
  provenance: DataProvenance;
}
export interface AgentAttribution {
  agentId: `AGT-${string}`;
  agentName: string;
  reality: "simulated-attribution";
}
export interface GrowthMetric extends GrowthMeta {
  id: "audience" | "reach" | "engagement" | "conversion" | "revenue";
  label: string;
  displayValue: string;
  change: number;
  trend: "up" | "stable" | "down";
  period: string;
}
export interface GrowthEvidence extends GrowthMeta {
  id: string;
  source: "Simulated signal";
  signal: string;
  observation: string;
  timestamp: string;
}
export interface GrowthTrend extends GrowthMeta {
  id: string;
  topic: string;
  category: string;
  velocity: number;
  acceleration: number;
  lifecycle: "emerging" | "accelerating" | "maturing" | "cooling";
  relevance: number;
  competition: number;
  coverage: number;
  opportunityScore: number;
  geography: string[];
  evidenceIds: string[];
  audienceIds: string[];
  relatedStoryIds: string[];
  agent: AgentAttribution;
}
export interface GrowthOpportunityRecord extends GrowthOpportunity, GrowthMeta {
  what: string;
  why: string;
  score: number;
  urgency: "watch" | "soon" | "now";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  trendIds: string[];
  audienceIds: string[];
  gapIds: string[];
  evidenceIds: string[];
  agent: AgentAttribution;
}
export interface ContentGap extends GrowthMeta {
  id: string;
  topic: string;
  trendId: string;
  opportunityId: string;
  demand: number;
  competitorCoverage: number;
  agbofaCoverage: number;
  gap: number;
  format: string;
  angle: string;
  platform: string;
  expectedImpact: string;
  evidenceIds: string[];
}
export interface AudienceSegment extends GrowthMeta {
  id: string;
  name: string;
  estimatedSize: number;
  engagement: number;
  retention: number;
  conversion: number;
  growth: number;
  interests: string[];
  geography: string[];
  lifecycle: "visitor" | "engaged" | "follower" | "registered" | "subscriber";
  formats: string[];
  highValue: boolean;
}
export interface CompetitorProfile extends GrowthMeta {
  id: string;
  name: string;
  scope: "simulated-public-profile";
  themes: Array<{ label: string; coverage: number }>;
  publishingPattern: string;
  engagementSignal: number;
  strengths: string[];
  gaps: string[];
  opportunityIds: string[];
}
export interface ContentDNA extends GrowthMeta {
  id: string;
  contentId: string;
  title: string;
  topic: string;
  tone: string;
  format: string;
  audienceFit: number;
  trendRelevance: number;
  strengths: string[];
  weaknesses: string[];
  adaptations: string[];
}
export interface GrowthForecast extends GrowthMeta {
  id: string;
  days: 30 | 60 | 90;
  metric: "audience" | "reach" | "subscribers";
  projected: number;
  range: { minimum: number; maximum: number };
  assumptions: string[];
}
export interface GrowthRecommendation extends GrowthMeta {
  id: string;
  title: string;
  why: string;
  evidenceIds: string[];
  impact: ExpectedImpact;
  cost: CostEstimate;
  risk: RiskLevel;
  nextAction: string;
  opportunityId: string;
  agent: AgentAttribution;
}
export interface GrowthIntelligenceData {
  metrics: GrowthMetric[];
  recommendation: GrowthRecommendation;
  opportunities: GrowthOpportunityRecord[];
  trends: GrowthTrend[];
  gaps: ContentGap[];
  audiences: AudienceSegment[];
  competitors: CompetitorProfile[];
  contentDNA: ContentDNA[];
  forecasts: GrowthForecast[];
  evidence: GrowthEvidence[];
  provenance: DataProvenance;
}
