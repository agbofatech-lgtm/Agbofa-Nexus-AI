"use client";

import React from "react";
import { UserRole } from "../types";

export interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
}

export function RoleBadge({ role, showIcon = true }: RoleBadgeProps): React.JSX.Element {
  let style = "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]";
  let icon = "👁";

  switch (role) {
    case "ADMIN":
      style =
        "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40 font-bold";
      icon = "⚡";
      break;
    case "EDITOR":
      style =
        "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40 font-semibold";
      icon = "✎";
      break;
    case "ANALYST":
      style =
        "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-semibold";
      icon = "📊";
      break;
    case "READER":
    default:
      style = "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]";
      icon = "👁";
      break;
  }

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-xs ${style}`}
    >
      {showIcon && <span aria-hidden="true">{icon}</span>}
      <span>{role}</span>
    </span>
  );
}

export default RoleBadge;
