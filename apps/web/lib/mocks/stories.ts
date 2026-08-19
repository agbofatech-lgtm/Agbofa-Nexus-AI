import type {
  StoryCategory,
  StoryEntities,
  StoryVerification,
} from "@/types/reader";
import type { StoryDetail, VerificationSource } from "@/types/story";

interface StorySeed {
  headline: string;
  summary: string;
  category: StoryCategory;
  source: string;
  hoursAgo: number;
  confidence: number;
  trendScore: number;
}

const storySeeds: readonly StorySeed[] = [
  {
    headline:
      "African Language Models Move From Translation Tools to Everyday Digital Infrastructure",
    summary:
      "Research teams across Accra, Nairobi, and Kigali are building smaller language models around local speech, public services, and culturally specific knowledge.",
    category: "AI",
    source: "Agbofa Intelligence",
    hoursAgo: 1,
    confidence: 96,
    trendScore: 99,
  },
  {
    headline:
      "New Evaluation Maps Where GPT-5, Claude, and Gemini Still Disagree on High-Stakes Questions",
    summary:
      "A cross-model benchmark focuses on evidence quality, uncertainty, and disagreement rather than a single leaderboard score.",
    category: "AI",
    source: "MIT Technology Review",
    hoursAgo: 3,
    confidence: 93,
    trendScore: 98,
  },
  {
    headline:
      "AI Safety Labs Turn to Continuous Red-Teaming as Agent Systems Gain More Autonomy",
    summary:
      "Model developers are expanding evaluations from one-time tests to live monitoring of tool use, memory, and multi-agent coordination.",
    category: "AI",
    source: "Reuters Technology",
    hoursAgo: 7,
    confidence: 91,
    trendScore: 94,
  },
  {
    headline:
      "Why Enterprise AI Agents Are Being Designed Around Permission Boundaries, Not Just Prompts",
    summary:
      "The next generation of workplace agents is emphasizing auditable tools, narrowly scoped actions, and human approval for irreversible decisions.",
    category: "AI",
    source: "The Decoder",
    hoursAgo: 12,
    confidence: 89,
    trendScore: 91,
  },
  {
    headline:
      "Open Research Coalition Publishes a Shared Test for Hallucination Recovery",
    summary:
      "The test measures whether a model can recognize weak evidence, retract a claim, and rebuild an answer from verifiable sources.",
    category: "AI",
    source: "Nature AI",
    hoursAgo: 20,
    confidence: 94,
    trendScore: 88,
  },
  {
    headline:
      "Small, Specialized Models Find a Home in Banks, Hospitals, and Public Agencies",
    summary:
      "Organizations are pairing compact models with controlled knowledge bases to lower cost while improving privacy and traceability.",
    category: "AI",
    source: "Rest of World",
    hoursAgo: 31,
    confidence: 87,
    trendScore: 85,
  },
  {
    headline:
      "The AGI Debate Shifts Toward Measurement: What Would Count as General Capability?",
    summary:
      "Researchers are proposing longer-horizon tests that examine adaptation, causal reasoning, and learning across unfamiliar domains.",
    category: "AI",
    source: "Science & Society",
    hoursAgo: 45,
    confidence: 84,
    trendScore: 82,
  },
  {
    headline:
      "West African Operators Complete First Cross-Border 5G Network-Slicing Trial",
    summary:
      "The pilot tests dedicated network capacity for emergency services and industrial logistics across neighboring markets.",
    category: "Technology",
    source: "TechCabal",
    hoursAgo: 2,
    confidence: 92,
    trendScore: 96,
  },
  {
    headline:
      "Quantum Networking Milestone Extends Stable Entanglement Across a Metropolitan Testbed",
    summary:
      "Engineers maintained synchronized quantum links across multiple nodes, moving practical secure networks a step closer.",
    category: "Technology",
    source: "IEEE Spectrum",
    hoursAgo: 5,
    confidence: 95,
    trendScore: 93,
  },
  {
    headline:
      "Reusable Launch Systems Push Smaller African Space Programs Toward Shared Missions",
    summary:
      "Lower launch costs are encouraging universities and public agencies to collaborate on climate and communications satellites.",
    category: "Technology",
    source: "SpaceNews Africa",
    hoursAgo: 10,
    confidence: 88,
    trendScore: 90,
  },
  {
    headline:
      "Edge Computing Returns to the Spotlight as Factories Demand Millisecond AI Decisions",
    summary:
      "Manufacturers are moving vision and safety models closer to production lines instead of relying exclusively on distant cloud regions.",
    category: "Technology",
    source: "Wired Business",
    hoursAgo: 18,
    confidence: 86,
    trendScore: 83,
  },
  {
    headline:
      "New Battery Chemistry Targets Longer-Lived Storage for Hot, Humid Climates",
    summary:
      "Materials researchers are optimizing stationary batteries for tropical grids where heat and humidity accelerate degradation.",
    category: "Technology",
    source: "CleanTech Review",
    hoursAgo: 28,
    confidence: 90,
    trendScore: 87,
  },
  {
    headline:
      "Satellite-to-Phone Services Begin Testing Emergency Coverage Beyond Mobile Towers",
    summary:
      "Telecom providers are evaluating direct links for disaster alerts and low-bandwidth messages in remote communities.",
    category: "Technology",
    source: "Global Telecom Monitor",
    hoursAgo: 39,
    confidence: 91,
    trendScore: 84,
  },
  {
    headline:
      "Privacy-Preserving Identity Pilots Aim to Prove Eligibility Without Exposing Personal Data",
    summary:
      "New digital identity trials use selective disclosure so people can confirm credentials without sharing full records.",
    category: "Technology",
    source: "Digital Public Goods Review",
    hoursAgo: 54,
    confidence: 89,
    trendScore: 81,
  },
  {
    headline:
      "Accra Startup Funding Rebounds as Investors Prioritize Revenue and Regional Distribution",
    summary:
      "Early-stage investors are returning with smaller, milestone-based rounds for companies showing durable demand across West Africa.",
    category: "Business",
    source: "Africa Business Daily",
    hoursAgo: 4,
    confidence: 90,
    trendScore: 95,
  },
  {
    headline:
      "Fintech Consolidation Enters a New Phase as Payments Firms Add Business Software",
    summary:
      "Acquirers are looking beyond transaction volume toward payroll, inventory, compliance, and cross-border operations.",
    category: "Business",
    source: "Bloomberg Africa",
    hoursAgo: 8,
    confidence: 92,
    trendScore: 92,
  },
  {
    headline:
      "Climate-Tech Founders Build Financing Models Around Verified Energy Savings",
    summary:
      "A new group of ventures is using measured reductions in energy costs to underwrite equipment for small businesses.",
    category: "Business",
    source: "Quartz Africa",
    hoursAgo: 15,
    confidence: 87,
    trendScore: 89,
  },
  {
    headline:
      "African SaaS Companies Expand Through Partnerships Instead of Costly New Offices",
    summary:
      "Regional software firms are working with banks, telecoms, and distributors to reach customers while keeping operating costs controlled.",
    category: "Business",
    source: "TechCabal",
    hoursAgo: 24,
    confidence: 88,
    trendScore: 86,
  },
  {
    headline:
      "Venture Debt Gains Ground, but Founders Face New Questions About Currency Risk",
    summary:
      "More growth companies are considering debt alongside equity as local-currency revenue meets dollar-denominated obligations.",
    category: "Business",
    source: "The Africa Report",
    hoursAgo: 34,
    confidence: 91,
    trendScore: 85,
  },
  {
    headline:
      "Logistics Platforms Race to Connect Informal Retail With Predictable Wholesale Supply",
    summary:
      "The strongest operators are combining demand forecasts, flexible credit, and neighborhood-scale fulfillment.",
    category: "Business",
    source: "Disrupt Africa",
    hoursAgo: 47,
    confidence: 86,
    trendScore: 80,
  },
  {
    headline:
      "Boards Add AI Governance to Core Risk Reviews as Automation Reaches Finance Teams",
    summary:
      "Directors are asking for model inventories, approval boundaries, and incident reporting before expanding autonomous workflows.",
    category: "Business",
    source: "Financial Times",
    hoursAgo: 62,
    confidence: 93,
    trendScore: 88,
  },
  {
    headline:
      "Low-Cost Agricultural Robots Learn to Navigate Farms Without Perfect GPS Coverage",
    summary:
      "A new field trial combines local mapping, compact vision models, and rugged hardware designed for smaller farms.",
    category: "Innovation",
    source: "Agbofa Intelligence",
    hoursAgo: 6,
    confidence: 93,
    trendScore: 97,
  },
  {
    headline:
      "Biotech Teams Use Portable Sequencing to Track Crop Disease in Days, Not Weeks",
    summary:
      "Field laboratories are helping extension officers identify outbreaks quickly enough to change planting and treatment decisions.",
    category: "Innovation",
    source: "Nature Africa",
    hoursAgo: 11,
    confidence: 96,
    trendScore: 94,
  },
  {
    headline:
      "Modular Solar Microgrids Add Predictive Maintenance for Rural Clinics",
    summary:
      "Sensors and lightweight forecasting models are reducing outages by detecting battery and inverter problems earlier.",
    category: "Innovation",
    source: "Clean Energy Africa",
    hoursAgo: 17,
    confidence: 91,
    trendScore: 91,
  },
  {
    headline:
      "Construction Startups Turn Recycled Plastic Into Traceable Building Components",
    summary:
      "Digital material passports are helping developers verify composition, strength, and reuse potential across a building lifecycle.",
    category: "Innovation",
    source: "Circular Economy Review",
    hoursAgo: 27,
    confidence: 85,
    trendScore: 84,
  },
  {
    headline:
      "Drone Corridors Move From Demonstrations to Scheduled Medical Deliveries",
    summary:
      "Aviation regulators and health systems are testing routine routes with shared traffic monitoring and weather controls.",
    category: "Innovation",
    source: "African Innovation Desk",
    hoursAgo: 37,
    confidence: 92,
    trendScore: 90,
  },
  {
    headline:
      "Water Utilities Test Acoustic AI to Find Underground Leaks Before Roads Fail",
    summary:
      "Networked sensors listen for subtle pressure and sound patterns, helping maintenance teams rank inspections.",
    category: "Innovation",
    source: "Smart Cities World",
    hoursAgo: 51,
    confidence: 88,
    trendScore: 82,
  },
  {
    headline:
      "Open Hardware Labs Make Assistive Devices Easier to Repair Locally",
    summary:
      "Clinicians and makers are redesigning mobility and communication devices around replaceable parts and regional supply chains.",
    category: "Innovation",
    source: "Global Innovation Exchange",
    hoursAgo: 68,
    confidence: 90,
    trendScore: 79,
  },
  {
    headline:
      "Astronomers Combine Radio Observatories to Produce a Sharper View of a Distant Jet",
    summary:
      "Coordinated observations across continents are revealing how magnetic fields shape material near a supermassive black hole.",
    category: "Science",
    source: "Science & Society",
    hoursAgo: 9,
    confidence: 97,
    trendScore: 93,
  },
  {
    headline:
      "Malaria Vaccine Research Focuses on Durable Protection Across Transmission Seasons",
    summary:
      "New studies are examining dosing schedules and immune markers that could help protection last through multiple high-risk periods.",
    category: "Science",
    source: "Nature Africa",
    hoursAgo: 14,
    confidence: 95,
    trendScore: 96,
  },
  {
    headline:
      "Deep-Ocean Sensors Reveal Faster Changes in Tropical Heat Storage",
    summary:
      "A wider sensor network is improving estimates of how oceans absorb and redistribute heat near the equator.",
    category: "Science",
    source: "Global Science Monitor",
    hoursAgo: 22,
    confidence: 94,
    trendScore: 88,
  },
  {
    headline: "Researchers Map How Sleep Timing Shapes Memory Consolidation",
    summary:
      "The work separates the effects of sleep duration from the timing of specific sleep stages after learning.",
    category: "Science",
    source: "New Scientist",
    hoursAgo: 32,
    confidence: 92,
    trendScore: 89,
  },
  {
    headline:
      "Lunar Geology Mission Tests Autonomous Navigation Around Permanently Shadowed Terrain",
    summary:
      "A compact rover is using local terrain models to plan safe routes where communications and lighting are limited.",
    category: "Science",
    source: "Space.com",
    hoursAgo: 44,
    confidence: 90,
    trendScore: 86,
  },
  {
    headline:
      "Gene-Editing Study Targets a Safer Delivery Method for Blood Disorders",
    summary:
      "Scientists are investigating whether temporary molecular carriers can reduce the complexity of current treatment workflows.",
    category: "Science",
    source: "STAT Science",
    hoursAgo: 59,
    confidence: 93,
    trendScore: 85,
  },
  {
    headline:
      "Citizen Science Network Publishes West Africa’s Most Detailed Urban Heat Map",
    summary:
      "Low-cost sensors installed by schools and community groups show how shade, road materials, and density shape neighborhood temperatures.",
    category: "Science",
    source: "African Science Journal",
    hoursAgo: 75,
    confidence: 89,
    trendScore: 83,
  },
  {
    headline:
      "Ghana’s Digital Public Services Roadmap Puts Interoperability Ahead of New Portals",
    summary:
      "The proposed approach prioritizes shared identity, payments, consent, and data standards so agencies can improve services together.",
    category: "Ghana",
    source: "Ghana News Agency",
    hoursAgo: 2,
    confidence: 95,
    trendScore: 98,
  },
  {
    headline:
      "Accra’s Startup Districts Spread Beyond the Traditional Innovation Hubs",
    summary:
      "New founder communities are forming around universities, creative studios, and distributed coworking spaces across the capital.",
    category: "Ghana",
    source: "Ghana Tech Review",
    hoursAgo: 6,
    confidence: 89,
    trendScore: 94,
  },
  {
    headline:
      "Local-Language Voice Services Expand Access to Agricultural Market Prices",
    summary:
      "Farmers can request regional price and weather updates through voice menus designed for common Ghanaian languages.",
    category: "Ghana",
    source: "Citi Business News",
    hoursAgo: 13,
    confidence: 92,
    trendScore: 92,
  },
  {
    headline:
      "Ghanaian Universities Form Shared Compute Network for Climate and Health Research",
    summary:
      "The collaboration pools specialist hardware and technical support so research teams can run larger models without duplicating infrastructure.",
    category: "Ghana",
    source: "University World News",
    hoursAgo: 21,
    confidence: 90,
    trendScore: 91,
  },
  {
    headline:
      "Tema Logistics Pilot Uses Digital Seals to Reduce Delays in High-Value Cargo",
    summary:
      "Operators are testing tamper signals and shared status records to improve handoffs between port, customs, and inland transport.",
    category: "Ghana",
    source: "Graphic Business",
    hoursAgo: 30,
    confidence: 88,
    trendScore: 87,
  },
  {
    headline:
      "Community Networks Bring Affordable Broadband to Underserved Northern Districts",
    summary:
      "Local operators are combining shared fiber, wireless links, and solar power to reach schools and small enterprises.",
    category: "Ghana",
    source: "Joy Business",
    hoursAgo: 43,
    confidence: 91,
    trendScore: 86,
  },
  {
    headline:
      "Ghana’s Creative Technology Studios Find New Audiences Through Interactive Storytelling",
    summary:
      "Teams working across animation, games, and immersive media are adapting local stories for global digital platforms.",
    category: "Ghana",
    source: "Agbofa Intelligence",
    hoursAgo: 58,
    confidence: 87,
    trendScore: 84,
  },
  {
    headline:
      "Pan-African Payment Links Move Closer to Instant Settlement for Small Businesses",
    summary:
      "New integrations are reducing the number of intermediaries needed to settle lower-value trade across regional currencies.",
    category: "Africa",
    source: "Africa Business Daily",
    hoursAgo: 5,
    confidence: 94,
    trendScore: 97,
  },
  {
    headline:
      "East African Climate Data Cooperative Opens Forecasting Tools to Local Developers",
    summary:
      "The cooperative is packaging weather observations and risk models into documented interfaces for agriculture and insurance products.",
    category: "Africa",
    source: "The EastAfrican",
    hoursAgo: 9,
    confidence: 91,
    trendScore: 93,
  },
  {
    headline:
      "Francophone Africa’s Fintech Ecosystem Builds Momentum Around Regional Infrastructure",
    summary:
      "Shared currency zones and interoperable mobile money systems are creating new paths for cross-market products.",
    category: "Africa",
    source: "TechCabal",
    hoursAgo: 16,
    confidence: 89,
    trendScore: 92,
  },
  {
    headline:
      "African Cities Coordinate Open Transit Data to Improve Cross-Platform Journey Planning",
    summary:
      "Transport authorities are standardizing route and service information so local developers can build more accurate mobility tools.",
    category: "Africa",
    source: "Mobility Africa",
    hoursAgo: 25,
    confidence: 88,
    trendScore: 87,
  },
  {
    headline:
      "Regional Health Supply Platform Uses Demand Signals to Reduce Medicine Stockouts",
    summary:
      "Participating clinics share anonymized inventory trends so distributors can anticipate shortages without exposing patient data.",
    category: "Africa",
    source: "Devex Africa",
    hoursAgo: 36,
    confidence: 92,
    trendScore: 90,
  },
  {
    headline:
      "Africa’s Earth Observation Startups Turn Satellite Data Into Farm-Level Decisions",
    summary:
      "The most useful products combine imagery with agronomy, local weather, and straightforward recommendations for field teams.",
    category: "Africa",
    source: "Space in Africa",
    hoursAgo: 49,
    confidence: 90,
    trendScore: 88,
  },
  {
    headline:
      "Continental Research Network Expands High-Speed Links Between Universities",
    summary:
      "The upgraded backbone is designed to support shared instruments, large scientific datasets, and cross-border teaching.",
    category: "Africa",
    source: "African Science Journal",
    hoursAgo: 66,
    confidence: 93,
    trendScore: 85,
  },
  {
    headline:
      "Global Regulators Converge on Disclosure Rules for High-Impact Automated Decisions",
    summary:
      "New frameworks increasingly require organizations to explain where automated systems are used, tested, and reviewed by people.",
    category: "Global",
    source: "Reuters Technology",
    hoursAgo: 4,
    confidence: 96,
    trendScore: 96,
  },
  {
    headline:
      "Semiconductor Investment Shifts Toward Packaging as Chiplet Designs Mature",
    summary:
      "Advanced packaging capacity is becoming as strategically important as fabrication for high-performance and specialized processors.",
    category: "Global",
    source: "Nikkei Asia",
    hoursAgo: 11,
    confidence: 93,
    trendScore: 95,
  },
  {
    headline:
      "Cities Form Procurement Alliance for Transparent, Auditable Urban AI",
    summary:
      "The group is sharing contract language for data rights, model monitoring, accessibility, and public accountability.",
    category: "Global",
    source: "Bloomberg CityLab",
    hoursAgo: 19,
    confidence: 91,
    trendScore: 91,
  },
  {
    headline:
      "Open-Source Maintainers Experiment With New Funding Models for Critical Infrastructure",
    summary:
      "Foundations and software buyers are testing pooled subscriptions tied to maintenance, security response, and long-term stewardship.",
    category: "Global",
    source: "The Register",
    hoursAgo: 29,
    confidence: 88,
    trendScore: 86,
  },
  {
    headline:
      "International Telescope Network Automates Follow-Up for Rare Cosmic Events",
    summary:
      "Observatories now coordinate within minutes when gravitational-wave and neutrino detectors flag a promising event.",
    category: "Global",
    source: "Global Science Monitor",
    hoursAgo: 41,
    confidence: 95,
    trendScore: 89,
  },
  {
    headline:
      "Digital Trade Agreements Begin Addressing Algorithmic Accountability and Data Portability",
    summary:
      "Negotiators are moving beyond data-flow rules to discuss practical safeguards for automated services and platform switching.",
    category: "Global",
    source: "Financial Times",
    hoursAgo: 55,
    confidence: 90,
    trendScore: 84,
  },
  {
    headline:
      "Public Interest Technology Programs Expand as Governments Compete for Digital Talent",
    summary:
      "Fellowships are pairing engineers, designers, and policy specialists with agencies working on high-impact public services.",
    category: "Global",
    source: "Rest of World",
    hoursAgo: 72,
    confidence: 87,
    trendScore: 81,
  },
];

const categoryImages: Record<StoryCategory, string> = {
  AI: "/images/stories/ai.svg",
  Technology: "/images/stories/technology.svg",
  Business: "/images/stories/business.svg",
  Innovation: "/images/stories/innovation.svg",
  Science: "/images/stories/science.svg",
  Ghana: "/images/stories/ghana.svg",
  Africa: "/images/stories/africa.svg",
  Global: "/images/stories/global.svg",
};

const categoryAuthors: Record<StoryCategory, string> = {
  AI: "Ama Boateng",
  Technology: "Kojo Asare",
  Business: "Nana Osei",
  Innovation: "Esi Mensah",
  Science: "Dr. Sena Adjei",
  Ghana: "Kweku Owusu",
  Africa: "Zainab Diallo",
  Global: "Maya Chen",
};

const categoryEntities: Record<StoryCategory, StoryEntities> = {
  AI: {
    people: ["AI researchers"],
    organizations: ["Model evaluation labs"],
    locations: ["Accra", "Africa"],
  },
  Technology: {
    people: ["Technology leaders"],
    organizations: ["Regional operators"],
    locations: ["West Africa"],
  },
  Business: {
    people: ["Founders", "Investors"],
    organizations: ["Growth companies"],
    locations: ["Africa"],
  },
  Innovation: {
    people: ["Researchers", "Builders"],
    organizations: ["Innovation laboratories"],
    locations: ["Global South"],
  },
  Science: {
    people: ["Research scientists"],
    organizations: ["University laboratories"],
    locations: ["Global"],
  },
  Ghana: {
    people: ["Ghanaian innovators"],
    organizations: ["Ghana technology ecosystem"],
    locations: ["Ghana", "Accra"],
  },
  Africa: {
    people: ["African founders"],
    organizations: ["Regional institutions"],
    locations: ["Africa"],
  },
  Global: {
    people: ["Global policy leaders"],
    organizations: ["International institutions"],
    locations: ["Global"],
  },
};

const referenceTime = Date.parse("2026-08-16T18:00:00Z");

function verificationFor(confidence: number, index: number): StoryVerification {
  if (confidence >= 90) return "verified";
  if (confidence >= 86) return index % 4 === 0 ? "in-review" : "verified";
  return index % 2 === 0 ? "in-review" : "pending";
}

const categoryPerspective: Record<StoryCategory, string> = {
  AI: "The central question is not simply what the model can do, but whether its decisions remain inspectable, bounded, and useful in the real world.",
  Technology:
    "The technical milestone matters because infrastructure becomes transformative only when it is reliable, affordable, and available beyond a small group of early adopters.",
  Business:
    "The market signal is strongest where sustainable revenue, local operating knowledge, and regional distribution reinforce one another.",
  Innovation:
    "The breakthrough combines scientific possibility with practical design constraints, turning a promising prototype into something communities can operate and maintain.",
  Science:
    "The evidence adds a meaningful piece to a larger scientific picture, while leaving clear questions for replication and longer-term study.",
  Ghana:
    "For Ghana, the opportunity lies in connecting policy ambition with delivery capacity, public trust, and measurable outcomes across communities.",
  Africa:
    "The continental context matters: shared infrastructure can create scale, but each market still requires local language, regulation, and distribution knowledge.",
  Global:
    "The global shift will be shaped as much by governance and access as by the pace of technical development itself.",
};

function createArticleContent(seed: StorySeed, index: number): string {
  const author = categoryAuthors[seed.category];
  const perspective = categoryPerspective[seed.category];
  const confidenceNote =
    seed.confidence >= 90
      ? "Multiple independent signals align, giving this briefing a high-confidence evidence profile."
      : "The core direction is supported, though several details remain under active review.";

  return [
    seed.summary,
    `Reporting by ${author} places the development within a wider ${seed.category.toLowerCase()} shift. The immediate announcement is important, but the more durable story is how institutions, builders, and communities respond over the next several months.`,
    "## Why this matters",
    perspective,
    `The Nexus review found that the strongest implications are likely to appear in implementation rather than headlines alone. Cost, access, governance, and the ability to learn from early deployments will determine whether the development produces broad value or remains concentrated.`,
    "## What the evidence shows",
    `${seed.source} provides the primary reporting signal. The verification layer compared the central claims with independent reporting patterns, institutional context, and the entities connected to the story. ${confidenceNote}`,
    `> “A credible signal should make uncertainty visible, preserve the source trail, and explain what evidence could change the conclusion.”`,
    "## What happens next",
    `The next stage is to watch for concrete milestones rather than promises. For story ${String(index + 1).padStart(3, "0")}, the Nexus desk will continue tracking primary documentation, independent confirmation, and meaningful changes in the confidence score.`,
    "- Watch for published implementation timelines and accountable owners.\n- Compare independent evidence with official statements.\n- Track who gains access, who carries risk, and how outcomes are measured.",
    `This article is part of the Agbofa Nexus Reader mock intelligence dataset. It demonstrates evidence-aware editorial presentation and does not represent a live news report.`,
  ].join("\n\n");
}

function createAISummary(seed: StorySeed): string {
  return `${seed.summary} Nexus analysis identifies implementation quality, independent verification, and measurable public value as the key signals to watch next.`;
}

function createVerificationSources(
  seed: StorySeed,
  index: number,
): VerificationSource[] {
  const thirdStatus =
    seed.confidence >= 90
      ? "supporting"
      : seed.confidence >= 86
        ? "unverified"
        : "conflicting";

  return [
    {
      name: seed.source,
      status: "supporting",
      details: "Primary reporting and publication record",
      credibility: Math.min(98, seed.confidence + 2),
    },
    {
      name: "Nexus cross-source desk",
      status: "supporting",
      details: "Independent context and claim comparison",
      credibility: 91 - (index % 4),
    },
    {
      name: `${seed.category} evidence registry`,
      status: thirdStatus,
      details:
        thirdStatus === "supporting"
          ? "Corroborating domain evidence"
          : thirdStatus === "unverified"
            ? "Additional primary documentation requested"
            : "One material detail remains disputed",
      credibility: Math.max(62, seed.confidence - 8),
    },
  ];
}

export const mockStories: StoryDetail[] = storySeeds.map((seed, index) => {
  const supporting = Math.max(7, Math.round(seed.confidence / 7));
  const conflicting = Math.max(1, Math.round((100 - seed.confidence) / 6));

  return {
    id: `story-${String(index + 1).padStart(3, "0")}`,
    headline: seed.headline,
    summary: seed.summary,
    category: seed.category,
    source: seed.source,
    author: categoryAuthors[seed.category],
    publishedAt: new Date(referenceTime - seed.hoursAgo * 60 * 60 * 1000),
    readingTime: 5 + (index % 6),
    image: categoryImages[seed.category],
    verification: verificationFor(seed.confidence, index),
    confidence: seed.confidence,
    trendScore: seed.trendScore,
    entities: categoryEntities[seed.category],
    content: createArticleContent(seed, index),
    aiSummary: createAISummary(seed),
    whyItMatters: categoryPerspective[seed.category],
    keySignals: [
      `${seed.category} implications depend on implementation quality`,
      "Independent confirmation remains the strongest signal to monitor",
      "Access, governance, and measurable outcomes shape long-term value",
    ],
    outlook: [
      "Published implementation milestones may clarify near-term direction",
      "Independent evidence could change the confidence assessment",
      "Regulatory, market, and community responses remain material variables",
    ],
    sources: createVerificationSources(seed, index),
    evidence: {
      supporting,
      conflicting,
      reviewedClaims: supporting + conflicting,
    },
  };
});

export const readerSources = Array.from(
  new Set(mockStories.map((story) => story.source)),
).sort((first, second) => first.localeCompare(second));
