"use client";

import { useParams, useRouter } from "next/navigation";

import { AISummary } from "@/components/features/story/AISummary";
import { ArticleBody } from "@/components/features/story/ArticleBody";
import { EntityList } from "@/components/features/story/EntityList";
import { HeroImage } from "@/components/features/story/HeroImage";
import { RelatedStories } from "@/components/features/story/RelatedStories";
import { ShareActions } from "@/components/features/story/ShareActions";
import { StoryHeader } from "@/components/features/story/StoryHeader";
import { StoryIntelligence } from "@/components/features/story/StoryIntelligence";
import { StoryNotFound } from "@/components/features/story/StoryNotFound";
import { StorySkeleton } from "@/components/features/story/StorySkeleton";
import { VerificationPanel } from "@/components/features/story/VerificationPanel";
import { useStory } from "@/hooks/useStory";
import { useReaderStore } from "@/stores/reader-store";

export default function StoryPage() {
  const params = useParams<{ storyId: string | string[] }>();
  const router = useRouter();
  const rawStoryId = params.storyId;
  const storyId = Array.isArray(rawStoryId)
    ? (rawStoryId[0] ?? "")
    : rawStoryId;
  const { story, relatedStories, loading, error, notFound, retry } =
    useStory(storyId);

  const openEntity = (entity: string) => {
    useReaderStore.getState().setSearchQuery(entity);
    router.push("/reader");
  };

  if (loading) return <StorySkeleton />;
  if (notFound || (!story && !error)) return <StoryNotFound />;
  if (error) return <StoryNotFound error={error} onRetry={retry} />;
  if (!story) return <StoryNotFound />;

  return (
    <article className="story-page">
      <StoryHeader
        author={story.author}
        category={story.category}
        confidence={story.confidence}
        headline={story.headline}
        publishedAt={story.publishedAt}
        readingTime={story.readingTime}
        source={story.source}
        subheadline={story.summary}
        verification={story.verification}
      />

      <HeroImage alt={story.headline} priority src={story.image} />

      <div className="story-reading-column">
        <ArticleBody content={story.content} />
        <AISummary summary={story.aiSummary} />
        <StoryIntelligence
          confidence={story.confidence}
          keySignals={story.keySignals}
          outlook={story.outlook}
          whyItMatters={story.whyItMatters}
        />
        <VerificationPanel
          confidence={story.confidence}
          evidence={story.evidence}
          sources={story.sources}
          status={story.verification}
        />
        <EntityList
          locations={story.entities?.locations}
          onSelect={openEntity}
          organizations={story.entities?.organizations}
          people={story.entities?.people}
        />
      </div>

      <RelatedStories
        onSelect={(id) => router.push(`/reader/${id}`)}
        stories={relatedStories}
      />

      <ShareActions
        summary={story.summary}
        title={story.headline}
        url={`/reader/${story.id}`}
      />
    </article>
  );
}
