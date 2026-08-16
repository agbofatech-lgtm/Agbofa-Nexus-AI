"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button, Input, Select, type SelectOption } from "@/components/ui";
import { readerSources } from "@/lib/mocks/stories";
import { useReaderStore } from "@/stores/reader-store";
import { storyCategories, type StoryCategory } from "@/types/reader";

const topicOptions: readonly SelectOption[] = [
  { value: "", label: "All topics" },
  ...storyCategories.map((category) => ({ value: category, label: category })),
];

const sourceOptions: readonly SelectOption[] = [
  { value: "", label: "All sources" },
  ...readerSources.map((source) => ({ value: source, label: source })),
];

export function FeedFilters() {
  const filters = useReaderStore((state) => state.filters);
  const searchQuery = useReaderStore((state) => state.searchQuery);
  const setFilters = useReaderStore((state) => state.setFilters);
  const setSearchQuery = useReaderStore((state) => state.setSearchQuery);
  const clearFilters = useReaderStore((state) => state.clearFilters);
  const hasFilters = Boolean(filters.topic || filters.source || searchQuery);

  return (
    <div className="feed-filters">
      <div className="feed-filters__label">
        <SlidersHorizontal size={14} /> Refine
      </div>
      <Select
        aria-label="Filter by topic"
        onValueChange={(value) =>
          setFilters({ topic: (value || null) as StoryCategory | null })
        }
        options={topicOptions}
        value={filters.topic ?? ""}
      />
      <Select
        aria-label="Filter by source"
        onValueChange={(value) => setFilters({ source: value || null })}
        options={sourceOptions}
        value={filters.source ?? ""}
      />
      <Input
        aria-label="Search stories"
        icon={<Search size={16} />}
        onChange={setSearchQuery}
        placeholder="Search stories, sources, entities..."
        type="search"
        value={searchQuery}
      />
      {hasFilters ? (
        <Button
          aria-label="Clear all reader filters"
          onClick={clearFilters}
          size="sm"
          variant="ghost"
        >
          <RotateCcw size={13} /> Clear
        </Button>
      ) : null}
    </div>
  );
}
