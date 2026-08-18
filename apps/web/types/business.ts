import type { DataAuthorityState, DataState } from "@/types/data-state";

export type ChannelStatus =
  | "connected"
  | "pending"
  | "not-created"
  | "not-verified"
  | "degraded"
  | "manual"
  | "unavailable";
export type ChannelType = "brand" | "personal";

export interface DistributionMetric {
  value: number | null;
  authority: DataAuthorityState;
  source: string;
}

export interface DistributionChannel {
  id: string;
  platform: string;
  type: ChannelType;
  priority: "primary" | "secondary" | "experimental";
  status: ChannelStatus;
  method: "api" | "manual" | "unavailable" | "not-verified";
  followers: DistributionMetric;
  reach: DistributionMetric;
  impressions: DistributionMetric;
  engagement: DistributionMetric;
  clicks: DistributionMetric;
  registrations: DistributionMetric;
  subscriptions: DistributionMetric;
  lastActivity: string | null;
  evidence: string;
}

export interface DistributionData {
  channels: DistributionChannel[];
  calendar: Array<{
    id: string;
    title: string;
    channel: string;
    scheduledFor: string;
    state: "draft" | "scheduled-demo" | "manual-required";
  }>;
  demoAnalytics: Array<{ label: string; brand: number; personal: number }>;
}

export interface GrowthData {
  metrics: Array<{
    id: string;
    label: string;
    value: number;
    unit: string;
    change: number;
  }>;
  flywheel: string[];
  funnel: Array<{ stage: string; value: number; conversion: number }>;
  channelComparison: Array<{
    channel: string;
    audience: "brand" | "personal";
    reach: number;
    clicks: number;
    registrations: number;
    subscriptions: number;
    conversion: number;
    retention: number;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    channel: string;
    status: "draft" | "running-demo" | "paused" | "completed";
    objective: string;
    result: string;
  }>;
  experiments: Array<{
    id: string;
    name: string;
    hypothesis: string;
    control: string;
    variant: string;
    metric: string;
    status: "draft" | "running" | "paused" | "completed" | "inconclusive";
    result: string;
    confidence: number;
  }>;
  recommendations: string[];
}

export interface MonetizationData {
  metrics: Array<{
    id: string;
    label: string;
    value: number;
    unit: string;
    change: number;
  }>;
  revenueSeries: Array<{
    label: string;
    revenue: number;
    subscribers: number;
    churn: number;
  }>;
  plans: Array<{
    id: string;
    name: "FREE" | "PREMIUM" | "PRO";
    price: number;
    interval: string;
    features: string[];
    subscribers: number;
    conversion: number;
    status: "active-demo" | "draft";
  }>;
  paywall: {
    freeArticles: number;
    previewLength: number;
    registrationGate: boolean;
    subscriptionGate: boolean;
    meteredAccess: boolean;
  };
  campaigns: Array<{
    id: string;
    name: string;
    offer: string;
    status: string;
    conversion: number;
  }>;
}

export interface AnalyticsData {
  overview: Array<{
    id: string;
    label: string;
    value: number;
    unit: string;
    change: number;
  }>;
  series: Array<{
    label: string;
    audience: number;
    content: number;
    distribution: number;
    growth: number;
    revenue: number;
    ai: number;
  }>;
  categories: Array<{
    label: string;
    engagement: number;
    registrations: number;
    confidence: number;
  }>;
  possibleDrivers: string[];
}

export interface AdminTenant {
  id: string;
  name: string;
  environment: "demo" | "staging-example";
  status: "active-demo" | "suspended-demo";
  users: number;
  plan: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Reader" | "Editor" | "Analyst" | "Admin" | "Superadmin";
  tenantId: string;
  status: "active-demo" | "invited-demo" | "disabled-demo";
}

export interface AdminData {
  currentTenant: {
    id: string;
    name: string;
    environment: string;
    role: string;
  };
  tenants: AdminTenant[];
  users: AdminUser[];
  audit: Array<{
    id: string;
    action: string;
    actor: string;
    target: string;
    result: string;
  }>;
  settings: {
    brandName: string;
    locale: string;
    reviewRequired: boolean;
    demoMode: boolean;
  };
}

export interface AICostData {
  metrics: Array<{
    id: string;
    label: string;
    value: number | null;
    unit: string;
    authority: DataAuthorityState;
  }>;
  providers: Array<{
    id: string;
    name: string;
    state: "demo" | "not-verified" | "unavailable";
    cost: number | null;
    requests: number | null;
    tokens: number | null;
    configuredLimit: number | null;
    usagePercent: number | null;
    source: string;
  }>;
  agentCosts: Array<{
    agentId: string;
    name: string;
    category: string;
    demoCost: number;
    requests: number;
    costPerRequest: number;
  }>;
  budget: {
    daily: number;
    monthly: number;
    warningThreshold: number;
    criticalThreshold: number;
    currentSpend: number;
    forecastSpend: number;
    status: "demo-normal" | "demo-warning" | "not-configured";
  };
  forecast: Array<{
    label: string;
    historical: number;
    current: number;
    forecast: number;
    confidence: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    action: string;
    savings: "NOT VERIFIED";
    confidence: string;
  }>;
}

export interface BusinessModules {
  distribution: DataState<DistributionData>;
  growth: DataState<GrowthData>;
  monetization: DataState<MonetizationData>;
  analytics: DataState<AnalyticsData>;
  admin: DataState<AdminData>;
  aiCost: DataState<AICostData>;
}
