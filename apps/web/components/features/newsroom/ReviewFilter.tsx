"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { Input, Select } from "@/components/ui";
import { useNewsroomStore } from "@/stores/newsroom-store";
import type { ReviewStatus } from "@/types/newsroom";

const statuses: Array<ReviewStatus | "all"> = [
  "all",
  "ingested",
  "processing",
  "verified",
  "review",
  "approved",
  "rejected",
  "published",
];

export function ReviewFilter() {
  const items = useNewsroomStore((state) => state.reviewItems);
  const filters = useNewsroomStore((state) => state.reviewFilters);
  const setFilters = useNewsroomStore((state) => state.setReviewFilters);
  const assignees = Array.from(
    new Set(items.map((item) => item.assignee)),
  ).sort();
  const sources = Array.from(new Set(items.map((item) => item.source))).sort();

  return (
    <div className="review-filter glass">
      <div
        className="review-status-tabs"
        role="tablist"
        aria-label="Review status"
      >
        {statuses.map((status) => (
          <button
            key={status}
            aria-selected={filters.status === status}
            onClick={() => setFilters({ status })}
            role="tab"
            type="button"
          >
            {status}
          </button>
        ))}
      </div>
      <div className="review-filter__controls">
        <span>
          <SlidersHorizontal size={13} /> Filter
        </span>
        <Select
          aria-label="Filter by assignee"
          onValueChange={(value) => setFilters({ assignee: value || null })}
          options={[
            { value: "", label: "All assignees" },
            ...assignees.map((assignee) => ({
              value: assignee,
              label: assignee,
            })),
          ]}
          value={filters.assignee ?? ""}
        />
        <Select
          aria-label="Filter by source"
          onValueChange={(value) => setFilters({ source: value || null })}
          options={[
            { value: "", label: "All sources" },
            ...sources.map((source) => ({ value: source, label: source })),
          ]}
          value={filters.source ?? ""}
        />
        <Input
          aria-label="Search review queue"
          icon={<Search size={15} />}
          onChange={(search) => setFilters({ search })}
          placeholder="Search headline..."
          type="search"
          value={filters.search}
        />
      </div>
    </div>
  );
}
