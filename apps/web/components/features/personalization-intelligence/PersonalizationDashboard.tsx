"use client";

import { IntelligenceState } from "@/components/features/intelligence/IntelligenceState";
import { FeedIntelligence } from "@/components/features/personalization-intelligence/FeedIntelligence";
import { PersonalizationHeader } from "@/components/features/personalization-intelligence/PersonalizationHeader";
import { PersonalizationIntelligenceSkeleton } from "@/components/features/personalization-intelligence/PersonalizationSkeleton";
import { PersonalizationSettings } from "@/components/features/personalization-intelligence/PersonalizationSettings";
import { PersonalizationStats } from "@/components/features/personalization-intelligence/PersonalizationStats";
import { ProfileManager } from "@/components/features/personalization-intelligence/ProfileManager";
import { RecommendationEngine } from "@/components/features/personalization-intelligence/RecommendationEngine";
import { TopicAffinity } from "@/components/features/personalization-intelligence/TopicAffinity";
import { useIntelligenceStore } from "@/stores/intelligence-store";
import { usePersonalization } from "@/hooks/usePersonalization";
import { usePersonalizationIntelligence } from "@/hooks/useIntelligence";

export function PersonalizationDashboard() {
  const intelligence = usePersonalizationIntelligence();
  const readerPersonalization = usePersonalization();
  const setSettings = useIntelligenceStore((state) => state.setSettings);
  if (intelligence.loading)
    return (
      <>
        <PersonalizationHeader />
        <PersonalizationIntelligenceSkeleton />
      </>
    );
  if (intelligence.error)
    return (
      <>
        <PersonalizationHeader />
        <IntelligenceState
          message={intelligence.error}
          onRetry={intelligence.retry}
          state="error"
        />
      </>
    );
  if (!intelligence.data)
    return (
      <>
        <PersonalizationHeader />
        <IntelligenceState state="empty" />
      </>
    );
  return (
    <div className="intelligence-page">
      <PersonalizationHeader />
      <PersonalizationStats metrics={intelligence.data.metrics} />
      <div className="personalization-intelligence-grid">
        <ProfileManager segments={intelligence.data.segments} />
        <RecommendationEngine
          currentRecommendations={readerPersonalization.recommendations}
          performance={intelligence.data.recommendations}
        />
      </div>
      <div className="personalization-intelligence-grid">
        <TopicAffinity topics={intelligence.data.topicAffinity} />
        <FeedIntelligence data={intelligence.data.feed} />
      </div>
      <PersonalizationSettings
        onChange={setSettings}
        settings={intelligence.settings}
      />
    </div>
  );
}
