import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

export function BusinessHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  actions?: ReactNode;
}) {
  return (
    <header className="business-header">
      <div>
        <span>
          <Building2 size={13} />
          {eyebrow}
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
