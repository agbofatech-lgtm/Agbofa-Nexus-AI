import type { LucideIcon } from "lucide-react";

interface IntelligenceMetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "gold" | "purple" | "blue" | "green" | "warning";
}

export function IntelligenceMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "gold",
}: IntelligenceMetricCardProps) {
  return (
    <article
      className={`intelligence-metric intelligence-metric--${tone} glass-card`}
    >
      <span>
        <Icon size={17} />
      </span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
      <p>{detail}</p>
    </article>
  );
}
