import { Radio, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface NewsroomHeaderProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function NewsroomHeader({
  title,
  subtitle,
  eyebrow = "Editorial command center",
  actions,
}: NewsroomHeaderProps) {
  return (
    <header className="newsroom-header">
      <div>
        <span className="newsroom-header__eyebrow">
          <Radio size={12} />
          <i /> {eyebrow}
        </span>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>{subtitle}</p>
      </div>
      <div className="newsroom-header__actions">
        <span className="newsroom-live">
          <Sparkles size={12} /> Systems live
        </span>
        {actions}
      </div>
    </header>
  );
}
