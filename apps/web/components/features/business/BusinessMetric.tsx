import type { LucideIcon } from "lucide-react";

import { DataAuthorityBadge } from "@/components/features/business/DataAuthorityBadge";
import type { DataAuthorityState } from "@/types/data-state";

export function BusinessMetric({
  label,
  value,
  detail,
  icon: Icon,
  authority = "demo",
  tone = "gold",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  authority?: DataAuthorityState;
  tone?: string;
}) {
  return (
    <article className={`business-metric business-metric--${tone} glass-card`}>
      <span>
        <Icon size={17} />
      </span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
      <p>{detail}</p>
      {authority !== "demo" ? <DataAuthorityBadge state={authority} /> : null}
    </article>
  );
}
