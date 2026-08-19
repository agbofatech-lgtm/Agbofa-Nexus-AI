import { Sparkles } from "lucide-react";

interface PersonalizationEmptyStateProps {
  title?: string;
  description?: string;
}

export function PersonalizationEmptyState({
  title = "No personalized stories yet.",
  description = "Choose a few interests and sources to help Nexus shape this section.",
}: PersonalizationEmptyStateProps) {
  return (
    <div className="personalization-empty glass" role="status">
      <span>
        <Sparkles size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}
