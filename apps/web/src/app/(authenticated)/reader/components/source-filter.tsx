"use client";

import React, { useState } from "react";

export interface SourceFilterProps {
  selected: string[];
  onChange: (sources: string[]) => void;
}

export interface SourceOption {
  id: string;
  label: string;
  icon: string;
}

const SOURCE_OPTIONS: SourceOption[] = [
  { id: "Twitter/X", label: "Twitter/X", icon: "𝕏" },
  { id: "Facebook", label: "Facebook", icon: "f" },
  { id: "Instagram", label: "Instagram", icon: "IG" },
  { id: "TikTok", label: "TikTok", icon: "TT" },
  { id: "LinkedIn", label: "LinkedIn", icon: "in" },
  { id: "YouTube", label: "YouTube", icon: "▶" },
  { id: "Reddit", label: "Reddit", icon: "r/" },
  { id: "RSS", label: "RSS", icon: "📰" },
];

export function SourceFilter({ selected, onChange }: SourceFilterProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleSource = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-between rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] transition-colors"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span>
            {selected.length === 0
              ? "All Sources / Platforms"
              : `Sources (${selected.length} selected)`}
          </span>
          <span className="ml-2 text-[10px] text-[#A0A4A8]">▼</span>
        </button>

        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20 transition-colors"
          >
            Clear ({selected.length})
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-64 rounded-md border border-[#2E2E32] bg-[#12121A] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between border-b border-[#2E2E32] pb-2">
            <span className="text-xs font-semibold text-[#FAFAFA]">Filter by Platform</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#A0A4A8] hover:text-[#FAFAFA]"
            >
              Close
            </button>
          </div>
          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
            {SOURCE_OPTIONS.map((opt) => {
              const isChecked = selected.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs text-[#FAFAFA] hover:bg-[#0066CC]/10 transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#2E2E32] text-[10px] font-bold text-[#3399FF]">
                      {opt.icon}
                    </span>
                    <span>{opt.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSource(opt.id)}
                    className="h-3.5 w-3.5 rounded border-[#2E2E32] bg-[#0A0A0B] text-[#0066CC] focus:ring-0"
                  />
                </label>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="mt-2 border-t border-[#2E2E32] pt-2 text-right">
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-[#CF2020] hover:underline"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SourceFilter;
