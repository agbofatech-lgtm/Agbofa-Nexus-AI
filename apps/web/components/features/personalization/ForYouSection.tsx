import { Sparkles, WandSparkles } from "lucide-react";

import { PersonalizationEmptyState } from "@/components/features/personalization/PersonalizationEmptyState";
import { PersonalizationSkeleton } from "@/components/features/personalization/PersonalizationSkeleton";
import { StoryCard } from "@/components/features/reader/StoryCard";
import type { PersonalizedStory } from "@/types/personalization";

interface ForYouSectionProps {
  stories: PersonalizedStory[];
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function ForYouSection({
  stories,
  onSelect,
  loading = false,
}: ForYouSectionProps) {
  return (
    <section
      className="personalization-section for-you-section"
      aria-labelledby="for-you-title"
    >
      <div className="personalization-heading">
        <div>
          <span className="section-kicker">
            <WandSparkles size={12} /> Personalized intelligence
          </span>
          <h2 id="for-you-title">
            For You<span>.</span>
          </h2>
        </div>
        <p>
          Selected from your topics, trusted sources, and high-confidence
          reading patterns.
        </p>
      </div>
      {loading ? (
        <PersonalizationSkeleton count={3} />
      ) : stories.length ? (
        <div className="personalization-story-grid">
          {stories.slice(0, 6).map((item) => (
            <div key={item.story.id} className="personalized-story">
              <StoryCard onSelect={onSelect} story={item.story} />
              <div className="personalized-reason">
                <Sparkles size={11} />
                <span>{item.reason}</span>
                <b>{Math.round(item.score)} match</b>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <PersonalizationEmptyState />
      )}
    </section>
  );
}
