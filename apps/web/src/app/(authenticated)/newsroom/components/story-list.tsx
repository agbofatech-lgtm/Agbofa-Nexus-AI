"use client";

import React, { useState } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { StoryListRowModel, StoryRow } from "./story-row";

export interface ColumnConfig {
  key: keyof StoryListRowModel;
  label: string;
  sortable?: boolean;
}

export interface StoryListProps {
  stories: StoryListRowModel[];
  columns?: ColumnConfig[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: string, checked: boolean) => void;
  onRowClick: (story: StoryListRowModel) => void;
  onAction?: (action: string, story: StoryListRowModel) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function StoryList({
  stories,
  columns = [
    { key: "sourcePlatform", label: "Source / Type", sortable: true },
    { key: "headline", label: "Headline & Meta", sortable: true },
    { key: "detectedAt", label: "Timestamp", sortable: true },
    { key: "priority", label: "Priority", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ],
  selectedIds,
  onSelectAll,
  onSelectRow,
  onRowClick,
  onAction,
  emptyTitle = "No stories in queue",
  emptyDescription = "There are currently no items matching your filter criteria.",
}: StoryListProps): React.JSX.Element {
  const [sortKey, setSortKey] = useState<keyof StoryListRowModel>("detectedAt");
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  const handleHeaderClick = (key: keyof StoryListRowModel, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  if (stories.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
        <img
          src={AuthoritativeBrandIdentity.assets.mark}
          alt="Agbofa Brand Mark"
          className="mx-auto mb-3 h-10 w-10 object-contain"
        />
        <h3 className="mb-1 text-base font-bold text-[#FAFAFA]">{emptyTitle}</h3>
        <p className="max-w-sm text-xs text-[#A0A4A8]">{emptyDescription}</p>
      </div>
    );
  }

  const allSelected =
    stories.length > 0 && selectedIds.length === stories.length;

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] shadow">
      {/* Desktop / Tablet Table View */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#2E2E32] bg-[#0A0A0B] text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all stories"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-[#2E2E32] bg-[#12121A] text-[#0066CC] focus:ring-0"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col.key, col.sortable)}
                  className={`px-4 py-3 ${col.sortable ? "cursor-pointer hover:text-[#FAFAFA]" : ""}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {sortKey === col.key && (
                      <span className="text-[#3399FF]">
                        {sortDesc ? "↓" : "↑"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                isSelected={selectedIds.includes(story.id)}
                onSelect={onSelectRow}
                onRowClick={onRowClick}
                onAction={onAction}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< 768px) */}
      <div className="divide-y divide-[#2E2E32] md:hidden">
        {stories.map((story) => {
          const isSelected = selectedIds.includes(story.id);
          return (
            <div
              key={story.id}
              onClick={() => onRowClick(story)}
              className="flex flex-col space-y-2 p-4 transition-colors hover:bg-[#0066CC]/10"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${story.headline}`}
                    checked={isSelected}
                    onChange={(e) => onSelectRow(story.id, e.target.checked)}
                    className="h-4 w-4 rounded border-[#2E2E32] bg-[#0A0A0B] text-[#0066CC]"
                  />
                  <span className="inline-flex rounded bg-[#12121A] px-2 py-0.5 text-[11px] font-medium text-[#3399FF] border border-[#2E2E32]">
                    {story.sourcePlatform || story.packageType || "Wire"}
                  </span>
                </div>
                <span className="text-[11px] text-[#A0A4A8]">
                  {story.detectedAt || story.submittedAt || "Just now"}
                </span>
              </div>

              <h4 className="text-sm font-bold text-[#FAFAFA]">
                {story.headline}
              </h4>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  {story.priority && (
                    <span className="rounded-full bg-[#CF2020]/20 px-2 py-0.5 text-[10px] font-bold text-[#CF2020]">
                      {story.priority}
                    </span>
                  )}
                  <span className="rounded-full bg-[#0066CC]/20 px-2 py-0.5 text-[10px] font-semibold text-[#3399FF]">
                    {story.status}
                  </span>
                </div>

                {onAction && (
                  <div
                    className="flex items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onAction("ASSIGN", story)}
                      className="rounded border border-[#2E2E32] px-2 py-1 text-[11px] text-[#FAFAFA]"
                    >
                      Assign
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction("ROUTE", story)}
                      className="rounded bg-[#0066CC] px-2 py-1 text-[11px] font-semibold text-[#FAFAFA]"
                    >
                      Route →
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StoryList;
