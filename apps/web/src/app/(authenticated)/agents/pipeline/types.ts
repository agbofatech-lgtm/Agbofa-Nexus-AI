/**
 * Agbofa Nexus AI — Pipeline Agent Dashboards Authoritative TypeScript Definitions (P0 Batch 13)
 * Defines types for the 8 pipeline agents (AGT-025 through AGT-032) and their specialized workflow visualizations.
 */

export type PipelineAgentHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "RATE_LIMITED"
  | "AUTH_FAILED"
  | "OFFLINE";

export interface PipelineAgentItem {
  agentId: string; // "AGT-025" to "AGT-032"
  name: string;
  type: string;
  squad: "PIPELINE";
  status: PipelineAgentHealthStatus;
  version: string;
  uptime: number; // e.g. 99.98
  lastHealthCheck: string; // ISO 8601
  itemsProcessed24h: number;
  avgLatencyMs: number; // p95 ms
  primaryMetricLabel: string;
  primaryMetricValue: string | number;
}

export type PipelineStageName =
  | "SIGNALS"
  | "DETECTIONS"
  | "VERIFICATIONS"
  | "ROUTING"
  | "DISTRIBUTION";

export interface PipelineStageFlowItem {
  stageId: PipelineStageName;
  label: string;
  itemsPerHour: number;
  queueDepth: number;
  avgProcessingTimeMs: number;
  isBottleneck: boolean;
}

export interface BottleneckAlertData {
  stageName: string;
  queueDepth: number;
  processingRatePerHour: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  autoScaleRecommendation: string;
  historicalFrequencyPct: number;
}

export interface IngestionRoutingData {
  tierCounts: {
    verifiedTruth: number;
    provisional: number;
    doubtful: number;
  };
  priorityCounts: {
    breaking: number;
    high: number;
    standard: number;
    low: number;
  };
  lifecycleCounts: {
    received: number;
    routed: number;
    processing: number;
    delivered: number;
    failed: number;
  };
  idempotency: {
    duplicatesDetected: number;
    successfullyDeduplicated: number;
  };
}

export interface ComplianceFlagItem {
  id: string;
  title: string;
  riskFactor: string;
  remediationStep: string;
  timestamp: string; // ISO 8601
}

export interface ComplianceScanData {
  statusCounts: {
    cleared: number;
    reviewRequired: number;
    flagged: number;
    blocked: number;
  };
  factorScans: {
    copyright: boolean;
    fairUse: boolean;
    licensing: boolean;
    libel: boolean;
    privacy: boolean;
    embargo: boolean;
  };
  fairUseAvgScore: number; // 0.0 to 1.0
  recentFlags: ComplianceFlagItem[];
}

export interface ModelHistoryRow {
  version: string;
  modelId: string;
  updatedAt: string; // ISO 8601
  changeType: string;
}

export interface FeedbackImpactData {
  modelsUpdated24h: number;
  trendChangePct: number; // e.g. +15
  credibilityChanges: {
    increased: number;
    decreased: number;
  };
  accuracyTrendSeries: Array<{
    day: string;
    accuracyPct: number;
  }>;
  driftAlertsCount: number;
  biasCreepAlertsCount: number;
  modelHistory: ModelHistoryRow[];
}

export interface StoryGraphUpdaterData {
  nodeOps: {
    created: number;
    updated: number;
    merged: number;
  };
  lifecycleCounts: {
    emerging: number;
    developing: number;
    verified: number;
    published: number;
    corrected: number;
  };
  entityStats: {
    entitiesFound: number;
    relationshipsCreated: number;
  };
  mergeStats: {
    mergesDetected: number;
    avgOverlapScore: number;
  };
  graphMetrics: {
    totalNodes: number;
    totalEdges: number;
    density: number;
  };
}

export interface FactoryIntakeData {
  packageTypeCounts: {
    article: number;
    socialPost: number;
    videoScript: number;
    audioTranscript: number;
    infographicSpec: number;
    multiChannel: number;
  };
  assetValidation: {
    complete: number;
    missing: number;
    generating: number;
  };
  brandVoice: {
    avgCompatibilityScore: number;
    mismatchesFlagged: number;
  };
  priorityAlignmentPct: number;
}

export interface DistributionSchedulerData {
  slotCounts: {
    immediate: number;
    scheduled: number;
    embargoed: number;
  };
  platformBreakdown: Array<{
    platform: string;
    count: number;
    status: "ONLINE" | "OFFLINE";
  }>;
  crossPlatformSequencingPct: number;
  embargoes: {
    activeCount: number;
    upcomingCount: number;
  };
}

export interface AnalyticsCollectorData {
  metrics24h: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clickThrough: number;
  };
  aggregates: {
    totalEngagement: number;
    crossPlatformReach: number;
    amplificationRate: number;
  };
  anomalies: {
    detectedCount: number;
    byType: Array<{ type: string; count: number }>;
  };
  timeSeriesPointsStored: number;
  platformComparison: Array<{
    platform: string;
    views: number;
    reach: number;
    engagementRate: number;
  }>;
}

export interface OpsMetaAgentData {
  fleetMatrix: {
    healthy: number;
    degraded: number;
    rateLimited: number;
    authFailed: number;
    offline: number;
  };
  throughputSummary: {
    signals: number;
    detections: number;
    verifications: number;
    routing: number;
    distribution: number;
  };
  alertSummary: {
    critical: number;
    warning: number;
    info: number;
  };
  agentHealthList: Array<{
    agentId: string;
    name: string;
    squad: string;
    status: string;
    uptime: number;
    p50: number;
    p95: number;
    p99: number;
  }>;
}
