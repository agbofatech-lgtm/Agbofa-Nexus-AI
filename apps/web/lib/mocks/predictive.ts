import type { PredictiveIntelligenceData } from "@/types/predictive";

export const mockPredictiveData: PredictiveIntelligenceData = {
  virality: {
    score: 82,
    expectedReach: 1_840_000,
    confidence: 88,
    direction: "rising",
    status: "accelerating",
  },
  engagement: {
    likes: 48_200,
    comments: 6_840,
    shares: 12_450,
    ctr: 7.8,
    engagementRate: 9.4,
    confidence: 86,
  },
  trends: [
    {
      id: "trend-1",
      topic: "African language AI",
      category: "AI",
      velocity: 91,
      direction: "up",
      seasonalPattern: "Sustained 6-week climb",
      confidence: 93,
    },
    {
      id: "trend-2",
      topic: "Digital public infrastructure",
      category: "Ghana",
      velocity: 78,
      direction: "up",
      seasonalPattern: "Policy-cycle acceleration",
      confidence: 89,
    },
    {
      id: "trend-3",
      topic: "Climate-fintech products",
      category: "Business",
      velocity: 66,
      direction: "stable",
      seasonalPattern: "Quarterly funding peaks",
      confidence: 81,
    },
    {
      id: "trend-4",
      topic: "Satellite connectivity",
      category: "Technology",
      velocity: 58,
      direction: "down",
      seasonalPattern: "Launch-window dependent",
      confidence: 77,
    },
  ],
  recommendations: [
    {
      id: "opt-1",
      type: "headline",
      title: "Lead with regional consequence",
      recommendation:
        "Move the Ghana and Africa impact into the first eight headline words.",
      expectedLift: 14,
      confidence: 87,
    },
    {
      id: "opt-2",
      type: "publishing-time",
      title: "Publish during commute peak",
      recommendation:
        "Demo model favors 06:45–07:30 GMT for this audience pattern.",
      expectedLift: 11,
      confidence: 82,
    },
    {
      id: "opt-3",
      type: "content",
      title: "Add evidence contrast",
      recommendation:
        "Place one supporting and one unresolved signal before the midpoint.",
      expectedLift: 9,
      confidence: 84,
    },
    {
      id: "opt-4",
      type: "media",
      title: "Use a data-led visual",
      recommendation:
        "A compact confidence and reach graphic outperforms a generic hero image in this sample.",
      expectedLift: 8,
      confidence: 79,
    },
    {
      id: "opt-5",
      type: "audience",
      title: "Bridge adjacent interests",
      recommendation:
        "Include a clean-energy or fintech connection to improve cross-topic discovery.",
      expectedLift: 7,
      confidence: 76,
    },
  ],
  series: Array.from({ length: 12 }, (_, index) => ({
    label: `T${index + 1}`,
    virality: 46 + index * 3 + Math.round(Math.sin(index / 1.8) * 8),
    engagement: 38 + index * 2.6 + Math.round(Math.cos(index / 2) * 7),
    confidence: 72 + index * 1.2 + Math.round(Math.sin(index / 2.4) * 3),
    velocity: 31 + index * 4 + Math.round(Math.cos(index / 1.7) * 9),
  })),
  mode: "demo",
  dataStatus: "complete",
};
