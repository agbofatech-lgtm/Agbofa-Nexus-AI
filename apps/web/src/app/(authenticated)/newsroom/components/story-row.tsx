"use client";

import React from "react";
import { OriginationPriority } from "../types";

export interface StoryListRowModel {
  id: string;
  headline: string;
  sourcePlatform?: string;
  sourceName?: string;
  detectedAt?: string;
  status: string;
  priority?: OriginationPriority;
  assignedTo?: string;
  packageType?: string;
  submittedBy?: string;
  submittedAt?: string;
  extraMeta?: string;
}

export interface StoryRowProps {
  story: StoryListRowModel;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onRowClick: (story: StoryListRowModel) => void;
  onAction?: (action: string, story: StoryListRowModel) => void;
}

function getPriorityStyle(priority?: OriginationPriority): string {
  switch (priority) {
    case "BREAKING":
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold";
    case "HIGH":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold";
    case "STANDARD":
      return "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40";
    case "LOW":
    default:
      return "bg-[#2E2E32]/40 text-[#A0A4A8] border border-[#2E2E32]";
  }
}

function getStatusStyle(status: string): string {
  const upper = status.toUpperCase();
  if (upper === "NEW" || upper === "PENDING" || upper === "PENDING_REVIEW") {
    return "bg-[#0066CC]/20 text-[#3399FF]";
  }
  if (upper === "PROCESSING" || upper === "PACKAGING" || upper === "IN_REVIEW") {
    return "bg-[#6C5CE7]/20 text-[#6C5CE7]";
  }
  if (upper === "ROUTED" || upper === "APPROVED") {
    return "bg-[#0D9040]/20 text-[#0D9040]";
  }
  if (upper === "REJECTED" || upper === "REVISION_REQUESTED") {
    return "bg-[#CF2020]/20 text-[#CF2020]";
  }
  return "bg-[#2E2E32] text-[#FAFAFA]";
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return "Just now";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StoryRow({
  story,
  isSelected,
  onSelect,
  onRowClick,
  onAction,
}: StoryRowProps): React.JSX.Element {
  return (
    <tr
      onClick={() => onRowClick(story)}
      className="group cursor-pointer border-b border-[#2E2E32] transition-colors hover:bg-[#0066CC]/10"
    >
      {/* Selection Checkbox */}
      <td
        className="w-10 px-4 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          aria-label={`Select story ${story.headline}`}
          checked={isSelected}
          onChange={(e) => onSelect(story.id, e.target.checked)}
          className="h-4 w-4 rounded border-[#2E2E32] bg-[#0A0A0B] text-[#0066CC] focus:ring-0"
        />
      </td>

      {/* Source Platform or Package Type */}
      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#A0A4A8]">
        {story.sourcePlatform ? (
          <span className="inline-flex items-center rounded bg-[#12121A] px-2 py-1 text-xs font-medium text-[#3399FF] border border-[#2E2E32]">
            {story.sourcePlatform}
          </span>
        ) : story.packageType ? (
          <span className="inline-flex items-center rounded bg-[#6C5CE7]/10 px-2 py-1 text-xs font-semibold text-[#6C5CE7] border border-[#6C5CE7]/30">
            {story.packageType}
          </span>
        ) : (
          <span className="text-[#A0A4A8]">—</span>
        )}
      </td>

      {/* Headline / Title */}
      <td className="max-w-md px-4 py-3">
        <div className="line-clamp-2 text-sm font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
          {story.headline}
        </div>
        {(story.sourceName || story.submittedBy) && (
          <div className="mt-0.5 text-[11px] text-[#A0A4A8]">
            {story.sourceName ? `Source: ${story.sourceName}` : `By ${story.submittedBy}`}
            {story.assignedTo && ` · Assigned to: ${story.assignedTo}`}
          </div>
        )}
      </td>

      {/* Detected At / Submitted At */}
      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#A0A4A8]">
        {formatRelativeTime(story.detectedAt || story.submittedAt)}
      </td>

      {/* Priority Badge */}
      <td className="whitespace-nowrap px-4 py-3">
        {story.priority ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${getPriorityStyle(story.priority)}`}
          >
            {story.priority}
          </span>
        ) : (
          <span className="text-xs text-[#A0A4A8]">—</span>
        )}
      </td>

      {/* Status Badge */}
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyle(story.status)}`}
        >
          {story.status}
        </span>
      </td>

      {/* Actions Cell */}
      <td
        className="whitespace-nowrap px-4 py-3 text-right text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end space-x-2">
          {onAction && (
            <>
              <button
                type="button"
                onClick={() => onAction("ASSIGN", story)}
                className="rounded border border-[#2E2E32] bg-[#12121A] px-2 py-1 text-[11px] font-medium text-[#FAFAFA] hover:border-[#0066CC] hover:text-[#3399FF]"
              >
                Assign
              </button>
              <button
                type="button"
                onClick={() => onAction("ROUTE", story)}
                className="rounded bg-[#0066CC] px-2 py-1 text-[11px] font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
              >
                Route →
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default StoryRow;
