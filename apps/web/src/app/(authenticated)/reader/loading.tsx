import React from "react";

export default function ReaderLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6" aria-label="Loading story feed">
      <div className="flex items-center justify-between border-b border-[#2E2E32] pb-4">
        <div>
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[#12121A]" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-md bg-[#12121A]" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow"
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="h-5 w-24 animate-pulse rounded-full bg-[#0A0A0B]" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-[#0A0A0B]" />
              </div>
              <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-[#0A0A0B]" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-[#0A0A0B]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#0A0A0B]" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[#2E2E32] pt-4">
              <div className="h-4 w-28 animate-pulse rounded bg-[#0A0A0B]" />
              <div className="h-8 w-24 animate-pulse rounded bg-[#0A0A0B]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
