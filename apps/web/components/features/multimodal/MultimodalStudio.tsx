"use client";

import { IntelligenceState } from "@/components/features/intelligence/IntelligenceState";
import { CrossMediaView } from "@/components/features/multimodal/CrossMediaView";
import { MediaPreview } from "@/components/features/multimodal/MediaPreview";
import { MediaUploader } from "@/components/features/multimodal/MediaUploader";
import { MultimodalHeader } from "@/components/features/multimodal/MultimodalHeader";
import { MultimodalSkeleton } from "@/components/features/multimodal/MultimodalSkeleton";
import { MultimodalStats } from "@/components/features/multimodal/MultimodalStats";
import { useMultimodalIntelligence } from "@/hooks/useIntelligence";

export function MultimodalStudio() {
  const multimodal = useMultimodalIntelligence();
  if (multimodal.loading)
    return (
      <>
        <MultimodalHeader />
        <MultimodalSkeleton />
      </>
    );
  if (multimodal.error)
    return (
      <>
        <MultimodalHeader />
        <IntelligenceState
          message={multimodal.error}
          onRetry={multimodal.retry}
          state="error"
        />
      </>
    );
  if (!multimodal.data)
    return (
      <>
        <MultimodalHeader />
        <IntelligenceState state="unavailable" />
      </>
    );
  return (
    <main className="intelligence-page">
      <MultimodalHeader />
      <MultimodalStats
        agentSummary={multimodal.agentSummary}
        data={multimodal.data}
        executionCount={multimodal.agentExecutions.length}
      />
      <div className="multimodal-workspace">
        <MediaUploader
          onProcess={(file) => void multimodal.processFile(file)}
          upload={multimodal.upload}
        />
        <MediaPreview
          analysis={multimodal.analysis ?? multimodal.data.sampleAnalysis}
        />
      </div>
      <CrossMediaView relationships={multimodal.data.relationships} />
    </main>
  );
}
