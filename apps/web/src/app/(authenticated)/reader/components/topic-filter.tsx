"use client";

import React from "react";

export interface TopicFilterProps {
  selected: string[];
  onChange: (topics: string[]) => void;
}

const AUTHORITATIVE_TOPICS = [
  "BREAKING",
  "POLITICS",
  "TECHNOLOGY",
  "BUSINESS",
  "SPORTS",
  "ENTERTAINMENT",
  "HEALTH",
  "SCIENCE",
] as const;

export function TopicFilter({ selected, onChange }: TopicFilterProps): React.JSX.Element {
  const toggleTopic = (topic: string) => {
    if (selected.includes(topic)) {
      onChange(selected.filter((t) => t !== topic));
    } else {
      onChange([...selected, topic]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#2E2E32]">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
        Topics:
      </span>
      {AUTHORITATIVE_TOPICS.map((topic) => {
        const isSelected = selected.includes(topic);
        return (
          <button
            key={topic}
            type="button"
            onClick={() => toggleTopic(topic)}
            aria-pressed={isSelected}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              isSelected
                ? "bg-[#0066CC] text-white font-semibold shadow-sm"
                : "border border-[#2E2E32] bg-[#12121A] text-[#A0A4A8] hover:border-[#0066CC] hover:text-[#FAFAFA]"
            }`}
          >
            {topic}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="shrink-0 rounded-full border border-[#CF2020]/40 bg-[#CF2020]/10 px-3 py-1.5 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20 transition-colors"
          aria-label="Clear all topic filters"
        >
          ✕ Clear all ({selected.length})
        </button>
      )}
    </div>
  );
}

export default TopicFilter;
