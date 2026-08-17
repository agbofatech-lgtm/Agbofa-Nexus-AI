"use client";

import { AlertTriangle, Scale } from "lucide-react";

import { ClaimCard } from "@/components/features/truth/ClaimCard";
import { EvidencePanel } from "@/components/features/truth/EvidencePanel";
import { EvidenceTimeline } from "@/components/features/truth/EvidenceTimeline";
import { TruthHeader } from "@/components/features/truth/TruthHeader";
import { TruthSummary } from "@/components/features/truth/TruthSummary";
import { Button, Skeleton } from "@/components/ui";
import { useTruth } from "@/hooks/useTruth";

export default function TruthPage() {
  const truth = useTruth();
  return (
    <main className="truth-page">
      <TruthHeader claims={truth.claims} />
      {truth.error ? (
        <div className="workspace-error glass" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Truth Engine unavailable</strong>
            <p>{truth.error}</p>
          </div>
          <Button onClick={truth.retry} size="sm">
            Retry
          </Button>
        </div>
      ) : null}
      {truth.loading.claims ? (
        <div className="truth-workspace">
          <div className="truth-claim-list">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} height={180} rounded="lg" />
            ))}
          </div>
          <Skeleton height={620} rounded="lg" />
        </div>
      ) : !truth.filteredClaims.length ? (
        <div className="newsroom-empty glass">
          <Scale size={25} />
          <div>
            <strong>No claims match this status.</strong>
            <p>Choose another status filter to continue the investigation.</p>
          </div>
        </div>
      ) : (
        <div className="truth-workspace">
          <aside
            className="truth-claim-list"
            aria-label="Claims under investigation"
          >
            {truth.filteredClaims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onSelect={truth.setSelectedClaimId}
                selected={claim.id === truth.selectedClaim?.id}
              />
            ))}
          </aside>
          {truth.selectedClaim ? (
            <div className="truth-detail">
              <TruthSummary claim={truth.selectedClaim} />
              <EvidencePanel claim={truth.selectedClaim} />
              <EvidenceTimeline claim={truth.selectedClaim} />
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
