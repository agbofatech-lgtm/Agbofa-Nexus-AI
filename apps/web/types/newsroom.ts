import type { WorkflowStage } from "@/types/operations";

export type SourceStatus = "active" | "degraded" | "inactive";
export type PipelineStageStatus = "complete" | "active" | "warning" | "pending";
export type PackageType =
  | "article"
  | "social"
  | "video"
  | "audio"
  | "newsletter"
  | "summary"
  | "headline"
  | "image";
export type FactoryStoryStatus = "verified" | "in-review" | "draft";
export type PackageStatus =
  "generated" | "editing" | "verified" | "approved" | "distributed";
export type ReviewStatus =
  | "ingested"
  | "processing"
  | "verified"
  | "review"
  | "approved"
  | "rejected"
  | "published";

export interface NewsSource {
  id: string;
  name: string;
  type: string;
  status: SourceStatus;
  lastIngestion: Date;
  itemsToday: number;
  health: number;
  region: string;
  initials: string;
}

export interface IngestionStage {
  id: string;
  label: string;
  status: PipelineStageStatus;
  processed: number;
  latencyMs: number;
}

export interface NewsroomMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  tone: "gold" | "blue" | "green" | "purple";
}

export interface NewsroomActivity {
  id: string;
  action: string;
  subject: string;
  detail: string;
  timestamp: Date;
  type: "verified" | "source" | "published" | "generated" | "review";
}

export interface NewsroomDashboardData {
  metrics: NewsroomMetric[];
  activity: NewsroomActivity[];
  workflow: WorkflowStage[];
  queueHealth: number;
  activeSources: number;
  pendingReviews: number;
  medianReviewMinutes: number;
}

export interface FactoryStory {
  id: string;
  headline: string;
  source: string;
  category: string;
  status: FactoryStoryStatus;
  confidence: number;
  updatedAt: Date;
}

export interface PackageOutput {
  type: PackageType;
  title: string;
  body: string;
  characterCount: number;
}

export interface StoryPackage {
  id: string;
  storyId: string;
  storyHeadline: string;
  types: PackageType[];
  outputs: PackageOutput[];
  status: PackageStatus;
  generatedAt: Date;
}

export interface ReviewItem {
  id: string;
  storyId: string;
  status: ReviewStatus;
  headline: string;
  source: string;
  timestamp: Date;
  assignee: string;
  confidence: number;
  priority: "critical" | "high" | "normal" | "low";
}

export interface ReviewFilters {
  status: ReviewStatus | "all";
  assignee: string | null;
  source: string | null;
  search: string;
}

export interface NewsroomLoadingState {
  dashboard: boolean;
  origination: boolean;
  factory: boolean;
  review: boolean;
  generating: boolean;
}
