export type ClaimStatus = "pending" | "in-review" | "verified" | "disputed";
export type TruthSourceStatus = "supporting" | "conflicting" | "unverified";
export type EvidenceStatus = "supporting" | "conflicting" | "unverified";

export interface TruthSource {
  id: string;
  name: string;
  status: TruthSourceStatus;
  credibility: number;
  details: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  detail: string;
  source: string;
  status: EvidenceStatus;
  publishedAt: Date;
}

export interface EvidenceBalance {
  supporting: number;
  conflicting: number;
  unverified: number;
}

export interface EvidenceTimelineEvent {
  id: string;
  date: Date;
  title: string;
  status: EvidenceStatus;
  detail: string;
}

export interface Claim {
  id: string;
  storyId: string;
  claim: string;
  context: string;
  status: ClaimStatus;
  confidence: number;
  category: string;
  owner: string;
  sources: TruthSource[];
  evidence: EvidenceBalance;
  evidenceItems: EvidenceItem[];
  timeline: EvidenceTimelineEvent[];
  updatedAt: Date;
}

export interface TruthLoadingState {
  claims: boolean;
  detail: boolean;
}
