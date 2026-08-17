import {
  MonetizationOverviewStats,
  RecentTransactionItem,
  SubscriptionPlanItem,
  StoredCard,
  InvoiceItem,
  MeteredUsageState,
  BillingCycleInfo,
  AdCampaignItem,
  MrrDataPoint,
  ChurnMetricsData,
  SubscriptionBreakdownData,
} from "./types";

export const INITIAL_OVERVIEW_STATS: MonetizationOverviewStats = {
  activeSubscriptionsCount: 1420,
  freeSubscriptionsCount: 1080,
  premiumSubscriptionsCount: 312,
  enterpriseSubscriptionsCount: 28,
  monthlyRecurringRevenueUsd: 14620, // $29 * 312 + $199 * 28 = $9048 + $5572 = $14620
  activeAdCampaignsCount: 12,
  paywallTriggers24h: 384,
  totalRevenueMonthUsd: 18950, // MRR + $4330 Ad revenue
};

export const SAMPLE_RECENT_TRANSACTIONS: RecentTransactionItem[] = [
  {
    id: "tx-501",
    type: "UPGRADE",
    description: "Subscription Upgraded to Premium Tier (Prorated)",
    amountUsd: 29.0,
    date: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "SUCCESS",
    planTier: "PREMIUM",
  },
  {
    id: "tx-502",
    type: "NEW_SUBSCRIPTION",
    description: "Enterprise Team Plan Activation (10 Seats)",
    amountUsd: 199.0,
    date: new Date(Date.now() - 3 * 3600000).toISOString(),
    status: "SUCCESS",
    planTier: "ENTERPRISE",
  },
  {
    id: "tx-503",
    type: "PAYMENT",
    description: "Ad Campaign Invoice #AC-9921 ('Q3 Enterprise Cloud')",
    amountUsd: 450.0,
    date: new Date(Date.now() - 8 * 3600000).toISOString(),
    status: "SUCCESS",
  },
  {
    id: "tx-504",
    type: "PAYMENT",
    description: "Premium Monthly Subscription Recurring Billing",
    amountUsd: 29.0,
    date: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: "SUCCESS",
    planTier: "PREMIUM",
  },
  {
    id: "tx-505",
    type: "DOWNGRADE",
    description: "Downgrade from Premium to Free Reader Tier",
    amountUsd: 0.0,
    date: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: "SUCCESS",
    planTier: "FREE",
  },
];

export const SAMPLE_SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: "FREE",
    name: "Free Reader Plan",
    priceMonthly: 0,
    meteredArticlesPerMonth: 5,
    features: [
      "5 metered premium articles/month",
      "Basic news feed access",
      "Standard reader search",
      "Standard community support",
    ],
    ctaLabel: "Current Plan",
    isHighlighted: false,
    supportLevel: "Standard Support",
  },
  {
    id: "PREMIUM",
    name: "Premium Reader Plan",
    priceMonthly: 29,
    meteredArticlesPerMonth: "UNLIMITED",
    features: [
      "Unlimited verified premium articles",
      "Full personalization intelligence (IMP-019)",
      "AI-curated recommendations & 'Because you read X'",
      "Priority customer support & zero ads",
    ],
    ctaLabel: "Subscribe Now ($29/mo)",
    isHighlighted: true,
    supportLevel: "Priority Support",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise Team Plan",
    priceMonthly: 199,
    meteredArticlesPerMonth: "UNLIMITED",
    features: [
      "Unlimited everything for 10 team seats",
      "Full API & AsyncAPI event stream access",
      "White label branding option & custom quotas",
      "Dedicated account manager & SLA",
    ],
    ctaLabel: "Contact Sales / Upgrade",
    isHighlighted: false,
    supportLevel: "Dedicated 24/7 SLA Support",
  },
];

export const SAMPLE_STORED_CARDS: StoredCard[] = [
  {
    id: "card-101",
    brand: "VISA",
    last4: "4242",
    expiryMonth: 8,
    expiryYear: 2028,
    isDefault: true,
  },
  {
    id: "card-102",
    brand: "MASTERCARD",
    last4: "8888",
    expiryMonth: 11,
    expiryYear: 2027,
    isDefault: false,
  },
];

export const SAMPLE_INVOICES: InvoiceItem[] = [
  {
    id: "INV-2026-008",
    date: "2026-08-01T00:00:00Z",
    description: "Premium Reader Monthly Subscription — August 2026",
    amountUsd: 29.0,
    status: "PAID",
    pdfUrl: "/invoices/INV-2026-008.pdf",
  },
  {
    id: "INV-2026-007",
    date: "2026-07-01T00:00:00Z",
    description: "Premium Reader Monthly Subscription — July 2026",
    amountUsd: 29.0,
    status: "PAID",
    pdfUrl: "/invoices/INV-2026-007.pdf",
  },
  {
    id: "INV-2026-006",
    date: "2026-06-01T00:00:00Z",
    description: "Premium Reader Monthly Subscription — June 2026",
    amountUsd: 29.0,
    status: "PAID",
    pdfUrl: "/invoices/INV-2026-006.pdf",
  },
  {
    id: "INV-2026-005",
    date: "2026-05-01T00:00:00Z",
    description: "Ad Campaign Invoice #AC-9011 (Q2 Tech Promotion)",
    amountUsd: 450.0,
    status: "PAID",
    pdfUrl: "/invoices/INV-2026-005.pdf",
  },
];

export const SAMPLE_METERED_USAGE: MeteredUsageState = {
  planTier: "FREE",
  articlesUsed: 3,
  articlesLimit: 5,
  resetsInDays: 14,
  resetDate: "2026-08-25T00:00:00Z",
};

export const SAMPLE_BILLING_CYCLE: BillingCycleInfo = {
  currentPeriodStart: "2026-08-01T00:00:00Z",
  currentPeriodEnd: "2026-08-31T23:59:59Z",
  nextBillingDate: "2026-09-01T00:00:00Z",
  planName: "Premium Reader Plan",
  monthlyRateUsd: 29.0,
};

export const SAMPLE_AD_CAMPAIGNS: AdCampaignItem[] = [
  {
    id: "camp-001",
    name: "Q3 Enterprise AI Cloud Infrastructure Promotion",
    status: "ACTIVE",
    budgetUsd: 5000.0,
    spendUsd: 2150.0,
    startDate: "2026-08-01T00:00:00Z",
    endDate: "2026-08-31T23:59:59Z",
    impressions: 142000,
    clicks: 4260,
    ctrPercentage: 3.0, // 3.0% CTR
    cpcUsd: 0.5, // $0.50 per click
    cpmUsd: 15.14, // CPM
    targetPlatforms: ["Twitter/X", "LinkedIn", "YouTube"],
    targetTopics: ["TECHNOLOGY", "BUSINESS"],
    excludedTopics: ["ENTERTAINMENT", "SPORTS"],
    excludedKeywords: ["controversy", "unverified", "gossip"],
    createdAt: "2026-07-28T14:00:00Z",
    platformBreakdown: [
      {
        platform: "Twitter/X",
        impressions: 68000,
        clicks: 2180,
        ctrPercentage: 3.2,
        spendUsd: 1090.0,
      },
      {
        platform: "LinkedIn",
        impressions: 54000,
        clicks: 1620,
        ctrPercentage: 3.0,
        spendUsd: 810.0,
      },
      {
        platform: "YouTube",
        impressions: 20000,
        clicks: 460,
        ctrPercentage: 2.3,
        spendUsd: 250.0,
      },
    ],
  },
  {
    id: "camp-002",
    name: "Autonomous Robotics Industry Summit 2026",
    status: "ACTIVE",
    budgetUsd: 3000.0,
    spendUsd: 1480.0,
    startDate: "2026-08-05T00:00:00Z",
    endDate: "2026-08-25T23:59:59Z",
    impressions: 98000,
    clicks: 3136,
    ctrPercentage: 3.2,
    cpcUsd: 0.47,
    cpmUsd: 15.1,
    targetPlatforms: ["LinkedIn", "Twitter/X"],
    targetTopics: ["TECHNOLOGY", "SCIENCE"],
    excludedTopics: [],
    excludedKeywords: [],
    createdAt: "2026-08-03T10:00:00Z",
    platformBreakdown: [
      {
        platform: "LinkedIn",
        impressions: 62000,
        clicks: 2108,
        ctrPercentage: 3.4,
        spendUsd: 980.0,
      },
      {
        platform: "Twitter/X",
        impressions: 36000,
        clicks: 1028,
        ctrPercentage: 2.85,
        spendUsd: 500.0,
      },
    ],
  },
  {
    id: "camp-003",
    name: "FinTech Security Zero-Trust Webinar Series",
    status: "PAUSED",
    budgetUsd: 2000.0,
    spendUsd: 700.0,
    startDate: "2026-08-01T00:00:00Z",
    endDate: "2026-08-15T23:59:59Z",
    impressions: 48000,
    clicks: 1344,
    ctrPercentage: 2.8,
    cpcUsd: 0.52,
    cpmUsd: 14.58,
    targetPlatforms: ["LinkedIn"],
    targetTopics: ["BUSINESS", "TECHNOLOGY"],
    excludedTopics: [],
    excludedKeywords: [],
    createdAt: "2026-07-30T09:00:00Z",
    platformBreakdown: [
      {
        platform: "LinkedIn",
        impressions: 48000,
        clicks: 1344,
        ctrPercentage: 2.8,
        spendUsd: 700.0,
      },
    ],
  },
  {
    id: "camp-004",
    name: "Q2 Green Energy & Clean Tech Report Sponsorship",
    status: "COMPLETED",
    budgetUsd: 4000.0,
    spendUsd: 4000.0,
    startDate: "2026-07-01T00:00:00Z",
    endDate: "2026-07-31T23:59:59Z",
    impressions: 260000,
    clicks: 8320,
    ctrPercentage: 3.2,
    cpcUsd: 0.48,
    cpmUsd: 15.38,
    targetPlatforms: ["Twitter/X", "Facebook", "LinkedIn"],
    targetTopics: ["SCIENCE", "BUSINESS"],
    excludedTopics: [],
    excludedKeywords: [],
    createdAt: "2026-06-25T11:00:00Z",
    platformBreakdown: [
      {
        platform: "Twitter/X",
        impressions: 120000,
        clicks: 4080,
        ctrPercentage: 3.4,
        spendUsd: 1950.0,
      },
      {
        platform: "LinkedIn",
        impressions: 90000,
        clicks: 2880,
        ctrPercentage: 3.2,
        spendUsd: 1400.0,
      },
      {
        platform: "Facebook",
        impressions: 50000,
        clicks: 1360,
        ctrPercentage: 2.72,
        spendUsd: 650.0,
      },
    ],
  },
];

export const SAMPLE_REVENUE_TREND: MrrDataPoint[] = [
  { month: "Sep 2025", mrrUsd: 8400, subscriptionRevenueUsd: 6200, adRevenueUsd: 2200 },
  { month: "Oct 2025", mrrUsd: 9100, subscriptionRevenueUsd: 6700, adRevenueUsd: 2400 },
  { month: "Nov 2025", mrrUsd: 9850, subscriptionRevenueUsd: 7200, adRevenueUsd: 2650 },
  { month: "Dec 2025", mrrUsd: 10400, subscriptionRevenueUsd: 7700, adRevenueUsd: 2700 },
  { month: "Jan 2026", mrrUsd: 11200, subscriptionRevenueUsd: 8300, adRevenueUsd: 2900 },
  { month: "Feb 2026", mrrUsd: 11800, subscriptionRevenueUsd: 8800, adRevenueUsd: 3000 },
  { month: "Mar 2026", mrrUsd: 12450, subscriptionRevenueUsd: 9300, adRevenueUsd: 3150 },
  { month: "Apr 2026", mrrUsd: 12900, subscriptionRevenueUsd: 9700, adRevenueUsd: 3200 },
  { month: "May 2026", mrrUsd: 13400, subscriptionRevenueUsd: 10100, adRevenueUsd: 3300 },
  { month: "Jun 2026", mrrUsd: 13950, subscriptionRevenueUsd: 10500, adRevenueUsd: 3450 },
  { month: "Jul 2026", mrrUsd: 14200, subscriptionRevenueUsd: 10700, adRevenueUsd: 3500 },
  { month: "Aug 2026", mrrUsd: 14620, subscriptionRevenueUsd: 11120, adRevenueUsd: 3500 },
];

export const SAMPLE_CHURN_METRICS: ChurnMetricsData = {
  mrrUsd: 14620,
  mrrChangePercentage: 12.4, // +12.4% vs last month
  arrUsd: 175440, // MRR * 12 invariant
  totalRevenuePeriodUsd: 18950, // MRR + Ad revenue
  arpuUsd: 42.5, // Avg revenue per paid user
  churnRatePercentage: 2.4, // 2.4% monthly churn
  churnRateChangePercentage: -0.6, // -0.6% improvement
  ltvUsd: 1770.83, // ARPU / ChurnRate (42.5 / 0.024)
  cacUsd: 15.0, // Authoritatively documented $15.00 default CAC assumption
  activeSubscribersCount: 1420,
  activeSubscribersChange: 68, // +68 net active this month
  newSubscribersThisMonth: 92,
  canceledSubscribersThisMonth: 24,
};

export const SAMPLE_SUBSCRIPTION_BREAKDOWN: SubscriptionBreakdownData = {
  freeCount: 1080,
  premiumCount: 312,
  enterpriseCount: 28,
  activeCount: 1390,
  trialingCount: 22,
  pastDueCount: 5,
  canceledCount: 3,
  freeToPremiumConversionRate: 6.8, // 6.8% Free -> Premium conversion rate
};
