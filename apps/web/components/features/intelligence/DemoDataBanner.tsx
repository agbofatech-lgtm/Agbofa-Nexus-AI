import { FlaskConical, ServerOff } from "lucide-react";

interface DemoDataBannerProps {
  label?: string;
  message?: string;
  partial?: boolean;
}

export function DemoDataBanner({
  label = "Development dataset",
  message = "Deterministic service-adapter data is active. No live intelligence provider is connected.",
  partial = false,
}: DemoDataBannerProps) {
  return (
    <div
      className={
        partial
          ? "demo-data-banner demo-data-banner--partial"
          : "demo-data-banner"
      }
      role="note"
    >
      <span>
        {partial ? <ServerOff size={15} /> : <FlaskConical size={15} />}
      </span>
      <div>
        <strong>{label}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
