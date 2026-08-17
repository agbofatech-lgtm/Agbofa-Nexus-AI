import { AlertTriangle, CheckCircle2, CircleHelp, Files } from "lucide-react";

import type { Claim, EvidenceStatus } from "@/types/truth";

interface EvidencePanelProps {
  claim: Claim;
}

const evidenceIcons = {
  supporting: CheckCircle2,
  conflicting: AlertTriangle,
  unverified: CircleHelp,
} as const;

export function EvidencePanel({ claim }: EvidencePanelProps) {
  const total = Math.max(
    1,
    claim.evidence.supporting +
      claim.evidence.conflicting +
      claim.evidence.unverified,
  );
  const percentage = (value: number) => Math.round((value / total) * 100);
  const rows: Array<{ status: EvidenceStatus; value: number }> = [
    { status: "supporting", value: claim.evidence.supporting },
    { status: "conflicting", value: claim.evidence.conflicting },
    { status: "unverified", value: claim.evidence.unverified },
  ];

  return (
    <section
      className="evidence-panel glass"
      aria-labelledby="evidence-panel-title"
    >
      <div className="truth-panel-heading">
        <div>
          <span className="section-kicker">
            <Files size={12} /> Evidence ledger
          </span>
          <h2 id="evidence-panel-title">Evidence</h2>
        </div>
        <span>{total} signals</span>
      </div>
      <div className="evidence-balance">
        {rows.map((row) => {
          const Icon = evidenceIcons[row.status];
          const value = percentage(row.value);
          return (
            <div
              key={row.status}
              className={`evidence-balance__row evidence-balance__row--${row.status}`}
            >
              <span>
                <Icon size={13} />
                <strong>{row.status}</strong>
                <b>
                  {row.value} · {value}%
                </b>
              </span>
              <i>
                <b style={{ width: `${value}%` }} />
              </i>
            </div>
          );
        })}
      </div>
      <div className="evidence-items">
        {claim.evidenceItems.map((item) => {
          const Icon = evidenceIcons[item.status];
          return (
            <article key={item.id}>
              <span
                className={`evidence-item__status evidence-item__status--${item.status}`}
              >
                <Icon size={14} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <small>{item.source}</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
