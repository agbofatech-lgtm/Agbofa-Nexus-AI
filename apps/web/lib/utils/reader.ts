import type { StoryVerification } from "@/types/reader";

export function formatRelativeTime(date: Date, now = new Date()): string {
  const differenceMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(differenceMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export function verificationLabel(verification: StoryVerification): string {
  const labels: Record<StoryVerification, string> = {
    verified: "Verified",
    "in-review": "In review",
    unverified: "Unverified",
    pending: "Pending",
  };
  return labels[verification];
}

export function confidenceBand(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 85) return "high";
  if (confidence >= 65) return "medium";
  return "low";
}
