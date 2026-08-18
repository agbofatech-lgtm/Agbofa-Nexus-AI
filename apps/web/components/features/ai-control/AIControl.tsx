"use client";

import { AIControlHeader } from "@/components/features/ai-control/AIControlHeader";
import { AIControlSkeleton } from "@/components/features/ai-control/AIControlSkeleton";
import { FallbackRouting } from "@/components/features/ai-control/FallbackRouting";
import { ModelSelector } from "@/components/features/ai-control/ModelSelector";
import { ProviderStatus } from "@/components/features/ai-control/ProviderStatus";
import { UsageMetrics } from "@/components/features/ai-control/UsageMetrics";
import { IntelligenceState } from "@/components/features/intelligence/IntelligenceState";
import { useAIControl } from "@/hooks/useIntelligence";

export function AIControl() {
  const control = useAIControl();
  if (control.loading)
    return (
      <>
        <AIControlHeader />
        <AIControlSkeleton />
      </>
    );
  if (control.error)
    return (
      <>
        <AIControlHeader />
        <IntelligenceState
          message={control.error}
          onRetry={control.retry}
          state="error"
        />
      </>
    );
  if (!control.data)
    return (
      <>
        <AIControlHeader />
        <IntelligenceState state="unavailable" />
      </>
    );
  const selectedProvider =
    control.data.providers.find(
      (provider) => provider.id === control.selectedProvider,
    ) ??
    control.data.providers[0] ??
    null;
  return (
    <main className="intelligence-page">
      <AIControlHeader />
      <UsageMetrics agents={control.agentSummary} data={control.data} />
      <section className="provider-grid" aria-label="Demo AI providers">
        {control.data.providers.map((provider) => (
          <ProviderStatus
            key={provider.id}
            onSelect={control.setSelectedProvider}
            provider={provider}
            selected={provider.id === selectedProvider?.id}
          />
        ))}
      </section>
      <div className="ai-control-grid">
        <ModelSelector
          onSelect={control.setSelectedModel}
          provider={selectedProvider}
          selectedModel={control.selectedModel}
        />
        <FallbackRouting providers={control.data.providers} />
      </div>
    </main>
  );
}
