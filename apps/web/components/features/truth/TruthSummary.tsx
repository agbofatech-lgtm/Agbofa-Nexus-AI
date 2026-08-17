import { ExternalLink, Scale, UserRound } from "lucide-react";
import Link from "next/link";

import { ConfidenceVisualization } from "@/components/features/truth/ConfidenceVisualization";
import { SourceCredibility } from "@/components/features/truth/SourceCredibility";
import { Badge } from "@/components/ui";
import type { Claim } from "@/types/truth";

interface TruthSummaryProps {
  claim: Claim;
}

const verificationStatus = {
  verified: "verified",
  "in-review": "in-review",
  pending: "pending",
  disputed: "unverified",
} as const;

export function TruthSummary({ claim }: TruthSummaryProps) {
  return (
    <section
      className="truth-summary glass-gold"
      aria-labelledby="truth-summary-title"
    >
      <div className="truth-summary__heading">
        <div>
          <span className="section-kicker">
            <Scale size={12} /> Active investigation
          </span>
          <h2 id="truth-summary-title">Claim analysis</h2>
        </div>
        <Badge
          verification={verificationStatus[claim.status]}
          variant="verification"
        >
          {claim.status}
        </Badge>
      </div>
      <blockquote>“{claim.claim}”</blockquote>
      <p>{claim.context}</p>
      <div className="truth-summary__meta">
        <span>
          <UserRound size={12} /> {claim.owner}
        </span>
        <span>{claim.category}</span>
        <Link href={`/reader/${claim.storyId}`}>
          Open story <ExternalLink size={11} />
        </Link>
      </div>
      <ConfidenceVisualization score={claim.confidence} />
      <div className="truth-summary__sources">
        <h3>Sources</h3>
        <ul>
          {claim.sources.map((source) => (
            <SourceCredibility key={source.id} source={source} />
          ))}
        </ul>
      </div>
    </section>
  );
}
