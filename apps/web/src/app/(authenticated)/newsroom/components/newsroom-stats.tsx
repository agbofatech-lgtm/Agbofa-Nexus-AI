"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PipelineStats } from "../types";

export interface NewsroomStatsProps {
  stats: PipelineStats;
}

export function NewsroomStats({ stats }: NewsroomStatsProps): React.JSX.Element {
  const router = useRouter();

  const statItems = [
    {
      id: "origination",
      label: "Origination Queue",
      count: stats.originationCount,
      subLabel: "NEW stories",
      href: "/newsroom/origination",
      color: "text-[#3399FF]",
      bg: "bg-[#0066CC]/10",
      border: "border-[#0066CC]/30",
    },
    {
      id: "verification",
      label: "Truth Verification",
      count: stats.verificationCount,
      subLabel: "IN_REVIEW stories",
      href: "/newsroom/truth",
      color: "text-[#6C5CE7]",
      bg: "bg-[#6C5CE7]/10",
      border: "border-[#6C5CE7]/30",
    },
    {
      id: "factory",
      label: "Content Factory",
      count: stats.factoryCount,
      subLabel: "PACKAGING stories",
      href: "/newsroom/factory",
      color: "text-[#FAFAFA]",
      bg: "bg-[#2E2E32]/30",
      border: "border-[#2E2E32]",
    },
    {
      id: "review",
      label: "Editorial Review",
      count: stats.reviewCount,
      subLabel: "PENDING_REVIEW",
      href: "/newsroom/review",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      id: "published",
      label: "Published Today",
      count: stats.publishedToday,
      subLabel: `${stats.publishedTrendChange >= 0 ? "+" : ""}${stats.publishedTrendChange}% vs yesterday`,
      href: "/reader",
      color: "text-[#0D9040]",
      bg: "bg-[#0D9040]/10",
      border: "border-[#0D9040]/30",
    },
  ];

  return (
    <div
      role="region"
      aria-label="Newsroom Pipeline Statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
    >
      {statItems.map((item) => (
        <div
          key={item.id}
          onClick={() => router.push(item.href)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(item.href);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${item.label}: ${item.count} ${item.subLabel}`}
          className={`flex cursor-pointer flex-col justify-between rounded-lg border ${item.border} ${item.bg} bg-[#12121A] p-4 transition-all hover:border-[#0066CC] hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#A0A4A8]">
              {item.label}
            </span>
            <span className="text-xs font-semibold text-[#A0A4A8]">→</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${item.color}`}>
              {item.count}
            </span>
            <span className="text-[11px] font-medium text-[#A0A4A8]">
              {item.subLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NewsroomStats;
