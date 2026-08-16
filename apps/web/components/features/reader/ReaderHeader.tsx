import { BookOpen, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui";
import { FeedFilters } from "@/components/features/reader/FeedFilters";
import { FeedSort } from "@/components/features/reader/FeedSort";

interface ReaderHeaderProps {
  total: number;
  loading: boolean;
}

export function ReaderHeader({ total, loading }: ReaderHeaderProps) {
  return (
    <header className="reader-header">
      <div className="reader-header__title-row">
        <div>
          <span className="reader-header__eyebrow">
            <BookOpen size={14} /> Your intelligence briefing
          </span>
          <h1>
            Reader<span>.</span>
          </h1>
          <p>
            AI-powered stories, verified and personalized for what you need to
            know.
          </p>
        </div>
        <div className="reader-header__status">
          <Badge status="running">
            <Sparkles size={11} /> Personalized
          </Badge>
          <span aria-live="polite">
            {loading ? "Updating feed…" : `${total} stories available`}
          </span>
        </div>
      </div>
      <div className="reader-header__controls glass">
        <FeedSort />
        <FeedFilters />
      </div>
    </header>
  );
}
