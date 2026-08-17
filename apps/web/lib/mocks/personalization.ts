import type {
  PersonalizationSource,
  PersonalizationTopic,
  ReaderPreferencesData,
} from "@/types/personalization";

export const mockPersonalizationTopics: readonly PersonalizationTopic[] = [
  {
    id: "AI",
    label: "Artificial Intelligence",
    description: "Models, agents, safety, and applied AI",
  },
  {
    id: "Technology",
    label: "Technology",
    description: "Infrastructure, computing, and connected systems",
  },
  {
    id: "Business",
    label: "Business",
    description: "Startups, capital, markets, and strategy",
  },
  {
    id: "Innovation",
    label: "Innovation",
    description: "Robotics, clean energy, biotech, and new products",
  },
  {
    id: "Science",
    label: "Science",
    description: "Research, health, climate, and space",
  },
  {
    id: "Ghana",
    label: "Ghana",
    description: "Local technology, policy, economy, and culture",
  },
  {
    id: "Africa",
    label: "Africa",
    description: "Continental technology and economic transformation",
  },
  {
    id: "Global",
    label: "Global",
    description: "International developments and connected impact",
  },
];

export const mockPersonalizationSources: readonly PersonalizationSource[] = [
  {
    id: "Agbofa Intelligence",
    name: "Agbofa Intelligence",
    focus: "Verified African intelligence",
  },
  {
    id: "Ghana News Agency",
    name: "Ghana News Agency",
    focus: "Ghana public affairs",
  },
  {
    id: "Ghana Tech Review",
    name: "Ghana Tech Review",
    focus: "Local technology ecosystem",
  },
  {
    id: "TechCabal",
    name: "TechCabal",
    focus: "African technology and startups",
  },
  { id: "Nature Africa", name: "Nature Africa", focus: "Science and research" },
  {
    id: "Reuters Technology",
    name: "Reuters Technology",
    focus: "Global verified technology news",
  },
  {
    id: "MIT Technology Review",
    name: "MIT Technology Review",
    focus: "Emerging technology analysis",
  },
  {
    id: "Africa Business Daily",
    name: "Africa Business Daily",
    focus: "Markets and enterprise",
  },
  {
    id: "Global Science Monitor",
    name: "Global Science Monitor",
    focus: "International research",
  },
  {
    id: "Rest of World",
    name: "Rest of World",
    focus: "Technology outside western centers",
  },
];

export const defaultReaderPreferences: ReaderPreferencesData = {
  topics: ["AI", "Ghana", "Technology"],
  sources: ["Agbofa Intelligence", "Ghana News Agency", "TechCabal"],
};

export const mockReadingHistory = [
  { storyId: "story-001", progress: 72, minutesAgo: 18 },
  { storyId: "story-036", progress: 46, minutesAgo: 95 },
  { storyId: "story-043", progress: 100, minutesAgo: 260 },
  { storyId: "story-009", progress: 28, minutesAgo: 580 },
  { storyId: "story-029", progress: 83, minutesAgo: 1440 },
] as const;
