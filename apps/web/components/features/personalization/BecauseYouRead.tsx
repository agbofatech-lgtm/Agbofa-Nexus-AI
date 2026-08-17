import { ArrowRight, BookOpenCheck, Network } from "lucide-react";

import { PersonalizationEmptyState } from "@/components/features/personalization/PersonalizationEmptyState";
import { PersonalizationSkeleton } from "@/components/features/personalization/PersonalizationSkeleton";
import { StoryCard } from "@/components/features/reader/StoryCard";
import { Badge } from "@/components/ui";
import type { PersonalizedStory } from "@/types/personalization";
import type { Story } from "@/types/reader";

interface BecauseYouReadProps {
  sourceStory: Story;
  recommendations: PersonalizedStory[];
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function BecauseYouRead({
  sourceStory,
  recommendations,
  onSelect,
  loading = false,
}: BecauseYouReadProps) {
  return (
    <section
      className="personalization-section because-section"
      aria-labelledby="because-title"
    >
      <div className="because-context glass-gold">
        <span className="because-context__icon">
          <BookOpenCheck size={19} />
        </span>
        <div>
          <span className="section-kicker">Because you read</span>
          <h2 id="because-title">{sourceStory.headline}</h2>
          <p>
            Nexus followed its category and entity graph to find the next useful
            signals.
          </p>
        </div>
        <Badge category={sourceStory.category} variant="category" />
      </div>
      {loading ? (
        <PersonalizationSkeleton count={3} />
      ) : recommendations.length ? (
        <div className="personalization-story-grid personalization-story-grid--four">
          {recommendations.map((item) => (
            <div key={item.story.id} className="personalized-story">
              <StoryCard onSelect={onSelect} story={item.story} />
              <div className="personalized-reason">
                <Network size={11} />
                <span>{item.reason}</span>
                <ArrowRight size={11} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <PersonalizationEmptyState
          title="No contextual recommendations yet."
          description="Read another story to create a new recommendation path."
        />
      )}
    </section>
  );
}
