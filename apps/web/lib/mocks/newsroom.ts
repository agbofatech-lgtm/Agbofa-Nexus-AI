import { mockStories } from "@/lib/mocks/stories";
import type {
  FactoryStory,
  IngestionStage,
  NewsroomActivity,
  NewsroomDashboardData,
  NewsSource,
  ReviewItem,
  ReviewStatus,
  SourceStatus,
  StoryPackage,
} from "@/types/newsroom";

const referenceTime = Date.parse("2026-08-17T12:00:00Z");

const sourceSeeds = [
  ["Reuters", "News Agency", "Global", "RE"],
  ["Ghana News Agency", "Public News Agency", "Ghana", "GNA"],
  ["Bloomberg Africa", "Business Wire", "Africa", "BA"],
  ["TechCabal", "Technology Publisher", "Africa", "TC"],
  ["Nature Africa", "Scientific Journal", "Africa", "NA"],
  ["MIT Technology Review", "Technology Journal", "Global", "MIT"],
  ["Citi Business News", "Business Publisher", "Ghana", "CB"],
  ["Joy Business", "Broadcast Publisher", "Ghana", "JB"],
  ["Graphic Business", "Newspaper", "Ghana", "GB"],
  ["Rest of World", "Technology Publisher", "Global", "RW"],
  ["Africa Business Daily", "Business Publisher", "Africa", "AD"],
  ["The Africa Report", "Current Affairs", "Africa", "AR"],
  ["Quartz Africa", "Digital Publisher", "Africa", "QA"],
  ["IEEE Spectrum", "Engineering Journal", "Global", "IE"],
  ["Space in Africa", "Space Publisher", "Africa", "SA"],
  ["Clean Energy Africa", "Sector Publisher", "Africa", "CE"],
  ["Devex Africa", "Development Publisher", "Africa", "DA"],
  ["Financial Times", "Business Publisher", "Global", "FT"],
  ["Nikkei Asia", "Business Publisher", "Asia", "NK"],
  ["New Scientist", "Scientific Publisher", "Global", "NS"],
  ["Agbofa Intelligence", "Internal Intelligence", "Ghana", "AN"],
  ["African Science Journal", "Scientific Journal", "Africa", "AS"],
  ["Digital Public Goods Review", "Policy Publisher", "Global", "DG"],
  ["Global Telecom Monitor", "Sector Intelligence", "Global", "GT"],
] as const;

const sourceStatus: SourceStatus[] = [
  "active",
  "active",
  "active",
  "degraded",
  "active",
  "active",
  "inactive",
  "active",
];

export const mockSources: NewsSource[] = sourceSeeds.map(
  ([name, type, region, initials], index) => {
    const status = sourceStatus[index % sourceStatus.length] ?? "active";
    const healthBase =
      status === "active" ? 96 : status === "degraded" ? 76 : 42;
    return {
      id: `source-${String(index + 1).padStart(3, "0")}`,
      name,
      type,
      region,
      initials,
      status,
      lastIngestion: new Date(referenceTime - (index + 1) * 11 * 60_000),
      itemsToday: 120 + ((index * 173) % 1_180),
      health: Number(
        Math.min(99.9, healthBase + ((index * 17) % 39) / 10).toFixed(1),
      ),
    };
  },
);

export const mockIngestionPipeline: IngestionStage[] = [
  {
    id: "discover",
    label: "Discover",
    status: "complete",
    processed: 2_847,
    latencyMs: 180,
  },
  {
    id: "ingest",
    label: "Ingest",
    status: "complete",
    processed: 2_706,
    latencyMs: 290,
  },
  {
    id: "normalize",
    label: "Normalize",
    status: "active",
    processed: 2_681,
    latencyMs: 410,
  },
  {
    id: "dedupe",
    label: "Dedupe",
    status: "warning",
    processed: 2_544,
    latencyMs: 720,
  },
  {
    id: "route",
    label: "Route",
    status: "pending",
    processed: 2_401,
    latencyMs: 0,
  },
];

const reviewStatuses: ReviewStatus[] = [
  "review",
  "verified",
  "processing",
  "approved",
  "ingested",
  "published",
  "review",
  "rejected",
];
const assignees = [
  "Kwame Mensah",
  "Ama Boateng",
  "Esi Adjei",
  "Kojo Asare",
  "Zainab Diallo",
  "Nana Osei",
] as const;

export const mockReviewItems: ReviewItem[] = mockStories.map(
  (story, index) => ({
    id: `review-${String(index + 1).padStart(3, "0")}`,
    storyId: story.id,
    status: reviewStatuses[index % reviewStatuses.length] ?? "review",
    headline: story.headline,
    source: story.source,
    timestamp: new Date(referenceTime - (index + 1) * 37 * 60_000),
    assignee: assignees[index % assignees.length] ?? "Unassigned",
    confidence: story.confidence,
    priority:
      index % 13 === 0
        ? "critical"
        : index % 5 === 0
          ? "high"
          : index % 7 === 0
            ? "low"
            : "normal",
  }),
);

export const mockFactoryStories: FactoryStory[] = mockStories
  .slice(0, 14)
  .map((story, index) => ({
    id: story.id,
    headline: story.headline,
    source: story.source,
    category: story.category,
    status:
      story.verification === "verified"
        ? "verified"
        : index % 3 === 0
          ? "draft"
          : "in-review",
    confidence: story.confidence,
    updatedAt: new Date(referenceTime - (index + 1) * 23 * 60_000),
  }));

export const mockNewsroomActivity: NewsroomActivity[] = [
  {
    id: "activity-001",
    action: "Story verified",
    subject: mockStories[0]?.headline ?? "AI language model briefing",
    detail: "Truth Engine aligned 14 supporting signals.",
    timestamp: new Date(referenceTime - 2 * 60_000),
    type: "verified",
  },
  {
    id: "activity-002",
    action: "Source connected",
    subject: "Reuters Technology",
    detail: "Health checks and ingestion permissions passed.",
    timestamp: new Date(referenceTime - 15 * 60_000),
    type: "source",
  },
  {
    id: "activity-003",
    action: "Package generated",
    subject: mockStories[7]?.headline ?? "5G network briefing",
    detail: "Article, social, and newsletter outputs are ready.",
    timestamp: new Date(referenceTime - 34 * 60_000),
    type: "generated",
  },
  {
    id: "activity-004",
    action: "Story published",
    subject: mockStories[35]?.headline ?? "Ghana public services roadmap",
    detail: "Published to web and mobile Reader channels.",
    timestamp: new Date(referenceTime - 64 * 60_000),
    type: "published",
  },
  {
    id: "activity-005",
    action: "Review assigned",
    subject: mockStories[14]?.headline ?? "Startup funding analysis",
    detail: "Assigned to Ama Boateng with high priority.",
    timestamp: new Date(referenceTime - 92 * 60_000),
    type: "review",
  },
];

export const mockDashboard: NewsroomDashboardData = {
  metrics: [
    {
      id: "total",
      label: "Total stories",
      value: 247,
      change: 12,
      tone: "gold",
    },
    { id: "review", label: "In review", value: 42, change: 8, tone: "blue" },
    {
      id: "published",
      label: "Published",
      value: 89,
      change: 5,
      tone: "green",
    },
    {
      id: "packages",
      label: "Packages today",
      value: 134,
      change: 17,
      tone: "purple",
    },
  ],
  activity: mockNewsroomActivity,
  queueHealth: 94.6,
  activeSources: mockSources.filter((source) => source.status === "active")
    .length,
};

export const mockGeneratedPackages: StoryPackage[] = [];
