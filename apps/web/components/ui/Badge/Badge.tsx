import { Check, Circle, CircleAlert, Clock3, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type BadgeStatus =
  "running" | "idle" | "queued" | "degraded" | "failed" | "disabled";
export type VerificationStatus =
  "verified" | "in-review" | "unverified" | "pending";
export type BadgeCategory =
  | "AI"
  | "Technology"
  | "Business"
  | "Innovation"
  | "Science"
  | "Ghana"
  | "Africa"
  | "Global";

export interface BadgeProps {
  variant?: "status" | "verification" | "category" | "confidence";
  status?: BadgeStatus;
  verification?: VerificationStatus;
  category?: BadgeCategory;
  confidence?: number;
  children?: ReactNode;
  className?: string;
}

const statusIcons: Record<BadgeStatus, ReactNode> = {
  running: <Circle fill="currentColor" size={8} />,
  idle: <Circle fill="currentColor" size={8} />,
  queued: <Clock3 size={12} />,
  degraded: <CircleAlert size={12} />,
  failed: <X size={12} />,
  disabled: <Circle size={10} />,
};

const verificationIcons: Record<VerificationStatus, ReactNode> = {
  verified: <Check size={12} strokeWidth={3} />,
  "in-review": <CircleAlert size={12} />,
  unverified: <Circle size={10} />,
  pending: <Clock3 size={12} />,
};

function clampConfidence(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function Badge({
  variant = "status",
  status = "idle",
  verification = "unverified",
  category = "Global",
  confidence = 0,
  children,
  className,
}: BadgeProps) {
  const normalizedConfidence = clampConfidence(confidence);
  const confidenceBand =
    normalizedConfidence >= 80
      ? "high"
      : normalizedConfidence >= 50
        ? "medium"
        : "low";

  const contentByVariant: Record<
    NonNullable<BadgeProps["variant"]>,
    ReactNode
  > = {
    status: (
      <>
        <span aria-hidden="true" className="nexus-badge__icon">
          {statusIcons[status]}
        </span>
        {children ?? status.replace("-", " ")}
      </>
    ),
    verification: (
      <>
        <span aria-hidden="true" className="nexus-badge__icon">
          {verificationIcons[verification]}
        </span>
        {children ?? verification.replace("-", " ")}
      </>
    ),
    category: children ?? category,
    confidence: (
      <>
        <span aria-hidden="true" className="nexus-badge__confidence-dot" />
        {children ?? `${normalizedConfidence}% confidence`}
      </>
    ),
  };

  const state =
    variant === "status"
      ? status
      : variant === "verification"
        ? verification
        : variant === "category"
          ? category.toLowerCase()
          : confidenceBand;

  return (
    <span
      className={cn(
        "nexus-badge",
        `nexus-badge--${variant}`,
        `nexus-badge--${state}`,
        className,
      )}
    >
      {contentByVariant[variant]}
    </span>
  );
}
