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
            Explore an evidence-aware editorial experience using a clearly
            identified local demonstration corpus.
          </p>
        </div>
        <div className="reader-header__status">
          <Badge status="idle">
            <Sparkles size={11} /> Demo corpus
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
