import { Compass, ShieldCheck } from "lucide-react";

import { PersonalizationEmptyState } from "@/components/features/personalization/PersonalizationEmptyState";
import { PersonalizationSkeleton } from "@/components/features/personalization/PersonalizationSkeleton";
import { StoryCard } from "@/components/features/reader/StoryCard";
import type { PersonalizedStory } from "@/types/personalization";

interface RecommendationsProps {
  stories: PersonalizedStory[];
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function Recommendations({
  stories,
  onSelect,
  loading = false,
}: RecommendationsProps) {
  return (
    <section
      className="personalization-section"
      aria-labelledby="recommendations-title"
    >
      <div className="personalization-heading">
        <div>
          <span className="section-kicker">
            <Compass size={12} /> Broaden your briefing
          </span>
          <h2 id="recommendations-title">Recommended for you</h2>
        </div>
        <p>
          High-quality stories just beyond your strongest interests, selected to
          reduce filter bubbles.
        </p>
      </div>
      {loading ? (
        <PersonalizationSkeleton count={4} />
      ) : stories.length ? (
        <div className="personalization-story-grid personalization-story-grid--four">
          {stories.map((item) => (
            <div key={item.story.id} className="personalized-story">
              <StoryCard onSelect={onSelect} story={item.story} />
              <div className="personalized-reason">
                <ShieldCheck size={11} />
                <span>{item.reason}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <PersonalizationEmptyState
          title="No recommendations available."
          description="Your recommendation horizon will grow as you read and save interests."
        />
      )}
    </section>
  );
}
