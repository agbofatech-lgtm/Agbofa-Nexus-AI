"use client";

import React from "react";

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  badgeLabel?: string;
  badgeStyle?: string;
  onClick?: () => void;
}

export function AdminStatCard({
  title,
  value,
  subText,
  badgeLabel,
  badgeStyle = "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40",
  onClick,
}: AdminStatCardProps): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : "region"}
      aria-label={`${title}: ${value}`}
      className={`flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 transition-all ${
        onClick ? "cursor-pointer hover:border-[#0066CC] hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
          {title}
        </span>
        {badgeLabel && (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeStyle}`}
          >
            {badgeLabel}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-[#FAFAFA]">{value}</span>
        {subText && (
          <span className="text-xs font-medium text-[#A0A4A8]">{subText}</span>
        )}
      </div>
    </div>
  );
}

export default AdminStatCard;
