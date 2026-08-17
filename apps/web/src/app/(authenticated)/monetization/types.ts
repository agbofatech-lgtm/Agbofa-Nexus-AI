/**
 * Agbofa Nexus AI — Monetization Intelligence Workspace Authoritative TypeScript Definitions (Phase 3 Batch 17 / IMP-021)
 * Defines structured types for Subscription Plans & Checkout, Billing History & Payment Methods,
 * Ad Campaign Management, and Revenue Analytics (MRR/ARR/LTV/CAC/Churn) across IMP-021.
 */

export type PlanTier = "FREE" | "PREMIUM" | "ENTERPRISE";

export interface SubscriptionPlanItem {
  id: PlanTier;
  name: string;
  priceMonthly: number; // e.g. 0, 29, 199
  meteredArticlesPerMonth: number | "UNLIMITED";
  features: string[];
  ctaLabel: string;
  isHighlighted: boolean;
  supportLevel: string;
}

export interface StoredCard {
  id: string;
  brand: "VISA" | "MASTERCARD" | "AMEX";
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export type InvoiceStatus = "PAID" | "PENDING" | "FAILED";

export interface InvoiceItem {
  id: string;
  date: string; // ISO 8601
  description: string;
  amountUsd: number;
  status: InvoiceStatus;
  pdfUrl: string;
}

export interface MeteredUsageState {
  planTier: PlanTier;
  articlesUsed: number;
  articlesLimit: number | "UNLIMITED";
  resetsInDays: number;
  resetDate: string;
}

export interface BillingCycleInfo {
  currentPeriodStart: string; // ISO 8601
  currentPeriodEnd: string;
  nextBillingDate: string;
  planName: string;
  monthlyRateUsd: number;
}

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";

export interface PlatformBreakdownItem {
  platform: string; // Twitter/X, Facebook, LinkedIn, Instagram, YouTube
  impressions: number;
  clicks: number;
  ctrPercentage: number;
  spendUsd: number;
}

export interface AdCampaignItem {
  id: string;
  name: string;
  status: CampaignStatus;
  budgetUsd: number;
  spendUsd: number;
  startDate: string; // ISO 8601
  endDate: string;
  impressions: number;
  clicks: number;
  ctrPercentage: number;
  cpcUsd: number;
  cpmUsd: number;
  targetPlatforms: string[];
  targetTopics: string[];
  excludedTopics: string[];
  excludedKeywords: string[];
  platformBreakdown: PlatformBreakdownItem[];
  createdAt: string;
}

export interface CampaignFormData {
  name: string;
  budgetUsd: number;
  startDate: string;
  endDate: string;
  targetPlatforms: string[];
  targetTopics: string[];
  excludedTopics: string[];
  excludedKeywords: string[];
}

export interface MrrDataPoint {
  month: string; // "Jan", "Feb", ... or "2026-01"
  mrrUsd: number;
  subscriptionRevenueUsd: number;
  adRevenueUsd: number;
}

export interface SubscriptionBreakdownData {
  freeCount: number;
  premiumCount: number;
  enterpriseCount: number;
  activeCount: number;
  trialingCount: number;
  pastDueCount: number;
  canceledCount: number;
  freeToPremiumConversionRate: number; // percentage e.g. 6.8
}

export interface ChurnMetricsData {
  mrrUsd: number;
  mrrChangePercentage: number;
  arrUsd: number;
  totalRevenuePeriodUsd: number;
  arpuUsd: number;
  churnRatePercentage: number;
  churnRateChangePercentage: number; // trend indicator
  ltvUsd: number; // ARPU / ChurnRate
  cacUsd: number; // $15 default assumption
  activeSubscribersCount: number;
  activeSubscribersChange: number;
  newSubscribersThisMonth: number;
  canceledSubscribersThisMonth: number;
}

export interface RecentTransactionItem {
  id: string;
  type: "PAYMENT" | "UPGRADE" | "DOWNGRADE" | "CANCELLATION" | "NEW_SUBSCRIPTION";
  description: string;
  amountUsd: number;
  date: string; // ISO 8601
  status: "SUCCESS" | "PENDING" | "FAILED";
  planTier?: PlanTier;
}

export interface MonetizationOverviewStats {
  activeSubscriptionsCount: number;
  freeSubscriptionsCount: number;
  premiumSubscriptionsCount: number;
  enterpriseSubscriptionsCount: number;
  monthlyRecurringRevenueUsd: number;
  activeAdCampaignsCount: number;
  paywallTriggers24h: number;
  totalRevenueMonthUsd: number;
}
