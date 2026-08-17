import {
  mockDashboard,
  mockFactoryStories,
  mockIngestionPipeline,
  mockReviewItems,
  mockSources,
} from "@/lib/mocks/newsroom";
import type {
  FactoryStory,
  IngestionStage,
  NewsroomDashboardData,
  NewsSource,
  PackageOutput,
  PackageStatus,
  PackageType,
  ReviewItem,
  StoryPackage,
} from "@/types/newsroom";

function delay(duration: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, duration);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function packageOutput(story: FactoryStory, type: PackageType): PackageOutput {
  const titleByType: Record<PackageType, string> = {
    article: story.headline,
    social: `${story.headline} — the signal in 3 points`,
    video: `Visual briefing: ${story.headline}`,
    audio: `Nexus audio briefing: ${story.headline}`,
    newsletter: `Inside the signal: ${story.headline}`,
    summary: `${story.headline} — executive summary`,
    headline: `What ${story.category} leaders need to know now`,
    image: `${story.category} visual intelligence card`,
  };
  const bodyByType: Record<PackageType, string> = {
    article: `A structured long-form article package based on the verified story “${story.headline},” with evidence notes, source attribution, and publication metadata.`,
    social: `The signal: ${story.headline}. Why it matters, what the evidence supports, and what to watch next.`,
    video: `A 90-second scene plan with opening hook, evidence sequence, expert context, and branded closing frame.`,
    audio: `A concise narrated briefing with source cues, confidence disclosure, and a clear next-signal watchlist.`,
    newsletter: `A newsletter module combining the headline, executive context, three evidence points, and a Reader call to action.`,
    summary: `A decision-ready summary of the central claim, evidence quality, implications, and unresolved questions.`,
    headline: `Three tested headline variants optimized for clarity, factual confidence, and audience relevance.`,
    image: `A watermarked 16:9 visual brief with category, key statistic, confidence score, and source attribution.`,
  };
  const body = bodyByType[type];
  return { type, title: titleByType[type], body, characterCount: body.length };
}

export const newsroomService = {
  async getDashboard(signal?: AbortSignal): Promise<NewsroomDashboardData> {
    await delay(360, signal);
    return mockDashboard;
  },

  async getSources(signal?: AbortSignal): Promise<NewsSource[]> {
    await delay(430, signal);
    return [...mockSources];
  },

  async getPipeline(signal?: AbortSignal): Promise<IngestionStage[]> {
    await delay(310, signal);
    return [...mockIngestionPipeline];
  },

  async getFactoryStories(signal?: AbortSignal): Promise<FactoryStory[]> {
    await delay(380, signal);
    return [...mockFactoryStories];
  },

  async getReviewItems(signal?: AbortSignal): Promise<ReviewItem[]> {
    await delay(460, signal);
    return [...mockReviewItems];
  },

  async generatePackage(
    story: FactoryStory,
    types: PackageType[],
    signal?: AbortSignal,
  ): Promise<StoryPackage> {
    await delay(780, signal);
    if (!types.length) throw new Error("Select at least one package type.");
    return {
      id: `package-${story.id}-${Date.now()}`,
      storyId: story.id,
      storyHeadline: story.headline,
      types: [...types],
      outputs: types.map((type) => packageOutput(story, type)),
      status: "generated",
      generatedAt: new Date(),
    };
  },

  async updatePackageStatus(
    current: StoryPackage,
    status: PackageStatus,
  ): Promise<StoryPackage> {
    await delay(260);
    return { ...current, status };
  },
};
