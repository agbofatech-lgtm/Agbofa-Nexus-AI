import { ArrowLeft, FileQuestion, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui";

interface StoryNotFoundProps {
  error?: string;
  onRetry?: () => void;
}

export function StoryNotFound({ error, onRetry }: StoryNotFoundProps) {
  return (
    <section
      className="story-not-found glass"
      role={error ? "alert" : "status"}
    >
      <span className="story-not-found__icon">
        <FileQuestion size={28} />
      </span>
      <span className="section-kicker">Story intelligence</span>
      <h1>
        {error
          ? "The story could not be loaded."
          : "This story is outside the Nexus."}
      </h1>
      <p>
        {error ??
          "The story ID may be invalid, or this briefing is no longer available in the active reader feed."}
      </p>
      <div>
        {error && onRetry ? (
          <Button onClick={onRetry}>
            <Search size={15} /> Retry
          </Button>
        ) : null}
        <Link className="story-not-found__back" href="/reader">
          <ArrowLeft size={15} /> Return to Reader
        </Link>
      </div>
    </section>
  );
}
