import { SearchX, Sparkles } from "lucide-react";

import { Button } from "@/components/ui";

interface ReaderEmptyStateProps {
  filtered: boolean;
  onReset: () => void;
}

export function ReaderEmptyState({ filtered, onReset }: ReaderEmptyStateProps) {
  return (
    <section className="reader-state glass" role="status">
      <span className="reader-state__icon">
        <SearchX size={27} />
      </span>
      <span className="section-kicker">
        <Sparkles size={12} /> Reader signal
      </span>
      <h2>
        {filtered ? "No stories match these filters." : "No stories found."}
      </h2>
      <p>
        {filtered
          ? "Try a broader topic, another source, or clear your search to reopen the full intelligence feed."
          : "The briefing queue is quiet right now. Check back as new intelligence is verified."}
      </p>
      {filtered ? <Button onClick={onReset}>Clear filters</Button> : null}
    </section>
  );
}
