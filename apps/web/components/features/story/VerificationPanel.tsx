"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { ConfidenceMeter } from "@/components/features/story/ConfidenceMeter";
import { SourceCredibility } from "@/components/features/story/SourceCredibility";
import { Badge, Button } from "@/components/ui";
import type { StoryVerification } from "@/types/reader";
import type { StoryEvidence, VerificationSource } from "@/types/story";

export interface VerificationPanelProps {
  status: StoryVerification;
  confidence: number;
  sources: VerificationSource[];
  evidence: StoryEvidence;
  onViewAnalysis?: () => void;
}

const statusCopy: Record<
  StoryVerification,
  { title: string; detail: string; icon: typeof CheckCircle2 }
> = {
  verified: {
    title: "Verified",
    detail: "Core claims are supported by aligned evidence.",
    icon: CheckCircle2,
  },
  "in-review": {
    title: "In review",
    detail: "Material claims remain under active human review.",
    icon: AlertTriangle,
  },
  unverified: {
    title: "Unverified",
    detail: "Independent evidence is not yet sufficient.",
    icon: CircleHelp,
  },
  pending: {
    title: "Pending",
    detail: "Verification has started but is not complete.",
    icon: CircleHelp,
  },
};

export function VerificationPanel({
  status,
  confidence,
  sources,
  evidence,
  onViewAnalysis,
}: VerificationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copy = statusCopy[status];
  const StatusIcon = copy.icon;
  const evidenceTotal = Math.max(1, evidence.supporting + evidence.conflicting);
  const supportingPercentage = Math.round(
    (evidence.supporting / evidenceTotal) * 100,
  );
  const conflictingPercentage = 100 - supportingPercentage;

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [expanded]);

  const openAnalysis = () => {
    setExpanded(true);
    onViewAnalysis?.();
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setExpanded(false);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <>
      <section
        className="verification-panel glass-gold"
        aria-labelledby="verification-title"
      >
        <div className="verification-panel__heading">
          <div>
            <span className="section-kicker">
              <ShieldCheck size={13} /> Trust layer
            </span>
            <h2 id="verification-title">Verification</h2>
          </div>
          <Badge verification={status} variant="verification" />
        </div>

        <div className="verification-overview">
          <div className={`verification-status verification-status--${status}`}>
            <span>
              <StatusIcon size={22} />
            </span>
            <div>
              <small>Status</small>
              <strong>{copy.title}</strong>
              <p>{copy.detail}</p>
            </div>
          </div>
          <ConfidenceMeter score={confidence} size="large" showLevel />
        </div>

        <div className="verification-panel__section">
          <div className="verification-panel__section-title">
            <span>
              <FileCheck2 size={14} /> Sources
            </span>
            <small>{sources.length} reviewed</small>
          </div>
          <ul className="source-list">
            {sources.map((source) => (
              <SourceCredibility
                key={`${source.name}-${source.status}`}
                source={source}
              />
            ))}
          </ul>
        </div>

        <div className="verification-panel__section">
          <div className="verification-panel__section-title">
            <span>
              <Scale size={14} /> Evidence
            </span>
            <small>{evidence.reviewedClaims} claims reviewed</small>
          </div>
          <div className="evidence-bars">
            <div>
              <span>
                <strong>Supporting</strong>
                <b>
                  {evidence.supporting} signals · {supportingPercentage}%
                </b>
              </span>
              <i>
                <b style={{ width: `${supportingPercentage}%` }} />
              </i>
            </div>
            <div className="evidence-bars__conflicting">
              <span>
                <strong>Conflicting</strong>
                <b>
                  {evidence.conflicting} signals · {conflictingPercentage}%
                </b>
              </span>
              <i>
                <b style={{ width: `${conflictingPercentage}%` }} />
              </i>
            </div>
          </div>
        </div>

        <Button ref={triggerRef} onClick={openAnalysis} variant="ghost">
          View full analysis <ChevronRight size={15} />
        </Button>
      </section>

      {expanded ? (
        <div
          className="verification-dialog-backdrop"
          role="presentation"
          onMouseDown={() => setExpanded(false)}
        >
          <div
            ref={dialogRef}
            aria-labelledby="verification-dialog-title"
            aria-modal="true"
            className="verification-dialog glass-dark"
            onKeyDown={handleDialogKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="verification-dialog__heading">
              <div>
                <span className="section-kicker">
                  <ShieldCheck size={13} /> Full evidence analysis
                </span>
                <h2 id="verification-dialog-title">
                  Why this story is {confidence}% confident
                </h2>
              </div>
              <button
                data-autofocus
                aria-label="Close verification analysis"
                className="icon-button"
                onClick={() => setExpanded(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <p className="verification-dialog__intro">
              Nexus confidence combines source credibility, independent
              alignment, evidence completeness, and visible contradictions. It
              is a decision aid—not a guarantee of truth.
            </p>
            <ConfidenceMeter score={confidence} size="large" showLevel />
            <div className="verification-dialog__grid">
              <section>
                <h3>Source assessment</h3>
                <ul className="source-list">
                  {sources.map((source) => (
                    <SourceCredibility
                      key={`dialog-${source.name}-${source.status}`}
                      source={source}
                    />
                  ))}
                </ul>
              </section>
              <section>
                <h3>Evidence balance</h3>
                <div
                  className="evidence-summary-ring"
                  style={
                    {
                      "--supporting": `${supportingPercentage}%`,
                    } as React.CSSProperties
                  }
                >
                  <div>
                    <strong>{supportingPercentage}%</strong>
                    <span>supporting</span>
                  </div>
                </div>
                <p>
                  {evidence.supporting} supporting signals and{" "}
                  {evidence.conflicting} conflicting signals were included in
                  this mock analysis.
                </p>
              </section>
            </div>
            <div className="verification-dialog__note">
              <AlertTriangle size={15} /> Confidence can change when new
              evidence is published or an existing source is corrected.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
