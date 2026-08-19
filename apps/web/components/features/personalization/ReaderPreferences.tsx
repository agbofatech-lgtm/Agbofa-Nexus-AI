"use client";

import { Check, SlidersHorizontal, Sparkles } from "lucide-react";

import { PersonalizationSkeleton } from "@/components/features/personalization/PersonalizationSkeleton";
import { Button } from "@/components/ui";
import type {
  PersonalizationSource,
  PersonalizationTopic,
} from "@/types/personalization";

interface ReaderPreferencesProps {
  topics: PersonalizationTopic[];
  sources: PersonalizationSource[];
  selectedTopics: string[];
  selectedSources: string[];
  onTopicToggle: (topicId: string) => void;
  onSourceToggle: (sourceId: string) => void;
  onSave: () => void;
  saving?: boolean;
  loading?: boolean;
  dirty?: boolean;
  successMessage?: string | null;
}

export function ReaderPreferences({
  topics,
  sources,
  selectedTopics,
  selectedSources,
  onTopicToggle,
  onSourceToggle,
  onSave,
  saving = false,
  loading = false,
  dirty = false,
  successMessage,
}: ReaderPreferencesProps) {
  if (loading) return <PersonalizationSkeleton variant="preferences" />;

  return (
    <section
      className="reader-preferences glass"
      aria-labelledby="reader-preferences-title"
    >
      <div className="reader-preferences__heading">
        <span className="reader-preferences__icon">
          <SlidersHorizontal size={18} />
        </span>
        <div>
          <span className="section-kicker">Tune your Nexus</span>
          <h2 id="reader-preferences-title">Reader preferences</h2>
          <p>
            Choose what deserves more weight. You can change this at any time.
          </p>
        </div>
        <div className="reader-preferences__count">
          <strong>{selectedTopics.length + selectedSources.length}</strong>
          <span>signals selected</span>
        </div>
      </div>

      <div className="preference-group">
        <h3>Topics</h3>
        <div className="preference-pills">
          {topics.map((topic) => {
            const selected = selectedTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                aria-pressed={selected}
                onClick={() => onTopicToggle(topic.id)}
                title={topic.description}
                type="button"
              >
                {selected ? <Check size={12} /> : <Sparkles size={11} />}{" "}
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="preference-group">
        <h3>Sources</h3>
        <div className="preference-pills preference-pills--sources">
          {sources.map((source) => {
            const selected = selectedSources.includes(source.id);
            return (
              <button
                key={source.id}
                aria-pressed={selected}
                onClick={() => onSourceToggle(source.id)}
                title={source.focus}
                type="button"
              >
                {selected ? <Check size={12} /> : null} {source.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="reader-preferences__footer">
        <span aria-live="polite">
          {successMessage ??
            (dirty
              ? "Unsaved preference changes"
              : "Preferences are up to date")}
        </span>
        <Button disabled={!dirty || saving} loading={saving} onClick={onSave}>
          {saving ? "Saving preferences" : "Save preferences"}
        </Button>
      </div>
    </section>
  );
}
