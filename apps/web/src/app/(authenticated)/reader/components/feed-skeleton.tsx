"use client";

import React from "react";

/**
 * FeedSkeleton component renders 6 skeleton cards with pulsing animation
 * matching the exact dimensions and responsive grid of StoryCard.
 */
export function FeedSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading story feed skeleton"
      role="status"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow transition-all"
        >
          <div>
            {/* Top row: Source badge + Confidence badge */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="h-5 w-28 animate-pulse rounded-full bg-[#0A0A0B]" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-[#0A0A0B]" />
            </div>

            {/* Headline skeleton */}
            <div className="mb-3 space-y-1.5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#0A0A0B]" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-[#0A0A0B]" />
            </div>

            {/* Summary skeleton */}
            <div className="space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-[#0A0A0B]" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#0A0A0B]" />
            </div>
          </div>

          {/* Bottom row: Status badge + Read time + Read button */}
          <div className="mt-6 flex items-center justify-between border-t border-[#2E2E32] pt-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-16 animate-pulse rounded bg-[#0A0A0B]" />
              <div className="h-4 w-12 animate-pulse rounded bg-[#0A0A0B]" />
            </div>
            <div className="h-7 w-20 animate-pulse rounded-md bg-[#0A0A0B]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeedSkeleton;
