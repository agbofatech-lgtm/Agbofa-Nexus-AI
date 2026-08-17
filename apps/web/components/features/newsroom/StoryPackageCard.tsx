import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/reader";
import type { FactoryStory } from "@/types/newsroom";

interface StoryPackageCardProps {
  story: FactoryStory;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function StoryPackageCard({
  story,
  selected,
  onSelect,
}: StoryPackageCardProps) {
  const verification =
    story.status === "verified"
      ? "verified"
      : story.status === "in-review"
        ? "in-review"
        : "pending";
  return (
    <button
      aria-pressed={selected}
      className={
        selected ? "factory-story factory-story--selected" : "factory-story"
      }
      onClick={() => onSelect(story.id)}
      type="button"
    >
      <span className="factory-story__category">{story.category}</span>
      <span className="factory-story__copy">
        <strong>{story.headline}</strong>
        <small>
          <span>{story.source}</span>
          <i />
          <Clock3 size={11} /> {formatRelativeTime(story.updatedAt)}
        </small>
      </span>
      <span className="factory-story__trust">
        <Badge verification={verification} variant="verification" />
        <small>
          <ShieldCheck size={11} /> {story.confidence}%
        </small>
      </span>
      <ArrowRight aria-hidden="true" size={15} />
    </button>
  );
}
