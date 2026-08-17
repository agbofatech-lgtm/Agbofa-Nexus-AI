import { ArrowRight, CheckCircle2, Clock3, History } from "lucide-react";

import { PersonalizationEmptyState } from "@/components/features/personalization/PersonalizationEmptyState";
import { PersonalizationSkeleton } from "@/components/features/personalization/PersonalizationSkeleton";
import { WatermarkedImage } from "@/components/shared/media/WatermarkedImage";
import { formatRelativeTime } from "@/lib/utils/reader";
import type { ReadingHistoryEntry } from "@/types/personalization";

interface ReadingHistoryProps {
  stories: ReadingHistoryEntry[];
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function ReadingHistory({
  stories,
  onSelect,
  loading = false,
}: ReadingHistoryProps) {
  return (
    <section
      className="personalization-section reading-history"
      aria-labelledby="history-title"
    >
      <div className="personalization-heading">
        <div>
          <span className="section-kicker">
            <History size={12} /> Your reading trail
          </span>
          <h2 id="history-title">Continue reading</h2>
        </div>
        <p>
          Pick up where you stopped or revisit intelligence that shaped your
          recent briefing.
        </p>
      </div>
      {loading ? (
        <PersonalizationSkeleton count={4} variant="rows" />
      ) : stories.length ? (
        <div className="reading-history__list glass">
          {stories.map((entry) => (
            <button
              key={entry.story.id}
              className="history-row"
              onClick={() => onSelect(entry.story.id)}
              type="button"
            >
              <span className="history-row__image">
                <WatermarkedImage
                  alt={`${entry.story.category} editorial illustration`}
                  fill
                  sizes="130px"
                  src={entry.story.image}
                  watermarkVariant="mini"
                />
              </span>
              <span className="history-row__copy">
                <small>
                  {entry.story.category} · {entry.story.source}
                </small>
                <strong>{entry.story.headline}</strong>
                <span>
                  <Clock3 size={11} /> {formatRelativeTime(entry.lastReadAt)} ·{" "}
                  {entry.progress === 100
                    ? "Completed"
                    : `${entry.progress}% read`}
                </span>
                <i>
                  <b style={{ width: `${entry.progress}%` }} />
                </i>
              </span>
              <span className="history-row__action">
                {entry.progress === 100 ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <PersonalizationEmptyState
          title="Your reading history is empty."
          description="Open a story and it will appear here for easy continuation."
        />
      )}
    </section>
  );
}
