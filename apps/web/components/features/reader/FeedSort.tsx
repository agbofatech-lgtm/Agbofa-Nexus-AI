"use client";

import { Clock3, Flame, ShieldCheck } from "lucide-react";

import { useReaderStore } from "@/stores/reader-store";
import type { FeedSort as FeedSortValue } from "@/types/reader";

const sortOptions = [
  { value: "latest", label: "Latest", icon: Clock3 },
  { value: "trending", label: "Trending", icon: Flame },
  { value: "confidence", label: "Highest confidence", icon: ShieldCheck },
] as const satisfies readonly {
  value: FeedSortValue;
  label: string;
  icon: typeof Clock3;
}[];

export function FeedSort() {
  const sort = useReaderStore((state) => state.sort);
  const setSort = useReaderStore((state) => state.setSort);

  return (
    <div aria-label="Sort reader feed" className="feed-sort" role="tablist">
      {sortOptions.map((option) => {
        const Icon = option.icon;
        const active = option.value === sort;
        return (
          <button
            key={option.value}
            aria-selected={active}
            className={
              active
                ? "feed-sort__option feed-sort__option--active"
                : "feed-sort__option"
            }
            onClick={() => setSort(option.value)}
            role="tab"
            type="button"
          >
            <Icon size={14} /> {option.label}
          </button>
        );
      })}
    </div>
  );
}
