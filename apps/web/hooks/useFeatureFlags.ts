"use client";
import {
  executionFeatureFlags,
  frontendFeatureFlags,
  isExecutionEnabled,
  isFrontendFeatureEnabled,
} from "@/lib/config/feature-flags";
export function useFeatureFlags() {
  return {
    features: frontendFeatureFlags,
    execution: executionFeatureFlags,
    isEnabled: isFrontendFeatureEnabled,
    canExecute: isExecutionEnabled,
  } as const;
}
