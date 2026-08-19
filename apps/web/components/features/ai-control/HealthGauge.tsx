interface HealthGaugeProps {
  value: number;
  label: string;
}

export function HealthGauge({ value, label }: HealthGaugeProps) {
  const normalized = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      className="provider-health-gauge"
      style={{ "--provider-health": `${normalized}%` } as React.CSSProperties}
    >
      <div>
        <strong>{normalized}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
