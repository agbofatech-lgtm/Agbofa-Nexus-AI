"use client";

import React from "react";
import { ServiceHealthStatus } from "../types";

export interface HealthGaugeProps {
  percentage: number; // e.g. 99.98
  label: string;
  status: ServiceHealthStatus;
  size?: "sm" | "md" | "lg";
}

function getHealthColor(status: ServiceHealthStatus): { stroke: string; text: string } {
  switch (status) {
    case "HEALTHY":
      return { stroke: "#0D9040", text: "text-[#0D9040]" };
    case "DEGRADED":
      return { stroke: "#F59E0B", text: "text-amber-400" };
    case "DOWN":
    default:
      return { stroke: "#CF2020", text: "text-[#CF2020]" };
  }
}

export function HealthGauge({
  percentage,
  label,
  status,
  size = "md",
}: HealthGaugeProps): React.JSX.Element {
  const color = getHealthColor(status);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, percentage) / 100) * circumference;

  let dim = 96;
  let textClass = "text-sm";
  if (size === "sm") {
    dim = 64;
    textClass = "text-xs";
  } else if (size === "lg") {
    dim = 128;
    textClass = "text-base";
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#2E2E32"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color.stroke}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`font-bold ${color.text} ${textClass}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <span className="mt-1 text-xs font-semibold text-[#A0A4A8]">{label}</span>
    </div>
  );
}

export default HealthGauge;
