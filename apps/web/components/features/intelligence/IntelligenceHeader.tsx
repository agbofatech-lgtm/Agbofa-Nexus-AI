import { BrainCircuit } from "lucide-react";
import type { ReactNode } from "react";

interface IntelligenceHeaderProps {
  title: string;
  subtitle: string;
  eyebrow: string;
  actions?: ReactNode;
}

export function IntelligenceHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: IntelligenceHeaderProps) {
  return (
    <header className="intelligence-header">
      <div>
        <span>
          <BrainCircuit size={13} /> {eyebrow}
        </span>
        <h1>
          {title}
          <b>.</b>
        </h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  );
}
