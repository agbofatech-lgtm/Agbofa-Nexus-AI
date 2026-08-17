import { mockStories } from "@/lib/mocks/stories";
import type {
  Claim,
  ClaimStatus,
  EvidenceStatus,
  TruthSourceStatus,
} from "@/types/truth";

const referenceTime = Date.parse("2026-08-17T12:00:00Z");
const claimStatuses: ClaimStatus[] = [
  "verified",
  "in-review",
  "pending",
  "verified",
  "disputed",
  "in-review",
];
const investigators = [
  "Sena Adjei",
  "Truth Agent Delta",
  "Ama Boateng",
  "Kojo Asare",
] as const;

function sourceStatus(index: number, confidence: number): TruthSourceStatus {
  if (index < 2) return "supporting";
  return confidence >= 90 ? "unverified" : "conflicting";
}

function evidenceStatus(index: number, confidence: number): EvidenceStatus {
  if (index < 2) return "supporting";
  return confidence >= 90 ? "unverified" : "conflicting";
}

export const mockClaims: Claim[] = mockStories
  .slice(0, 24)
  .map((story, index) => {
    const status = claimStatuses[index % claimStatuses.length] ?? "pending";
    const supporting = 8 + (index % 9);
    const conflicting = status === "disputed" ? 5 : 1 + (index % 3);
    const unverified = 1 + (index % 2);

    return {
      id: `claim-${String(index + 1).padStart(3, "0")}`,
      storyId: story.id,
      claim: story.headline,
      context: story.summary,
      status,
      confidence:
        status === "disputed"
          ? Math.min(story.confidence, 64)
          : story.confidence,
      category: story.category,
      owner: investigators[index % investigators.length] ?? "Truth Desk",
      updatedAt: new Date(referenceTime - (index + 1) * 29 * 60_000),
      sources: [
        {
          id: `claim-${index + 1}-source-1`,
          name: story.source,
          status: "supporting",
          credibility: Math.min(99, story.confidence + 2),
          details: "Primary publication and reporting record",
        },
        {
          id: `claim-${index + 1}-source-2`,
          name: "Nexus independent verification desk",
          status: "supporting",
          credibility: 92 - (index % 4),
          details: "Independent context and evidence comparison",
        },
        {
          id: `claim-${index + 1}-source-3`,
          name: `${story.category} evidence registry`,
          status: sourceStatus(2, story.confidence),
          credibility: Math.max(58, story.confidence - 11),
          details:
            status === "disputed"
              ? "Material contradiction requires human resolution"
              : "Additional primary documentation requested",
        },
      ],
      evidence: { supporting, conflicting, unverified },
      evidenceItems: Array.from({ length: 4 }, (_, evidenceIndex) => ({
        id: `claim-${index + 1}-evidence-${evidenceIndex + 1}`,
        title:
          evidenceIndex === 0
            ? "Primary reporting record"
            : evidenceIndex === 1
              ? "Independent corroboration"
              : evidenceIndex === 2
                ? "Domain context review"
                : "Contradiction scan",
        detail:
          evidenceIndex < 2
            ? "Evidence aligns with the central claim and publication timeline."
            : "Evidence adds context or identifies a detail requiring further review.",
        source: evidenceIndex === 0 ? story.source : "Nexus Truth Desk",
        status: evidenceStatus(
          evidenceIndex,
          status === "disputed" ? 55 : story.confidence,
        ),
        publishedAt: new Date(
          referenceTime - (index * 4 + evidenceIndex + 1) * 8 * 60 * 60_000,
        ),
      })),
      timeline: Array.from({ length: 5 }, (_, timelineIndex) => ({
        id: `claim-${index + 1}-timeline-${timelineIndex + 1}`,
        date: new Date(
          referenceTime - (5 - timelineIndex) * (index + 2) * 7 * 60 * 60_000,
        ),
        title:
          timelineIndex === 0
            ? "Claim detected"
            : timelineIndex === 1
              ? "Primary source captured"
              : timelineIndex === 2
                ? "Independent evidence compared"
                : timelineIndex === 3
                  ? "Contradictions assessed"
                  : "Confidence updated",
        status: evidenceStatus(
          timelineIndex === 4 ? 1 : timelineIndex % 3,
          story.confidence,
        ),
        detail: "The evidence ledger recorded this verification event.",
      })),
    };
  });
