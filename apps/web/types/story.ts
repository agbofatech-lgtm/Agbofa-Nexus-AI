import type { Story as ReaderStory } from "@/types/reader";

export type VerificationSourceStatus =
  "supporting" | "conflicting" | "unverified";

export interface VerificationSource {
  name: string;
  status: VerificationSourceStatus;
  details?: string;
  credibility: number;
}

export interface StoryEvidence {
  supporting: number;
  conflicting: number;
  reviewedClaims: number;
}

export interface StoryDetail extends ReaderStory {
  content: string;
  aiSummary: string;
  whyItMatters: string;
  keySignals: string[];
  outlook: string[];
  sources: VerificationSource[];
  evidence: StoryEvidence;
}
