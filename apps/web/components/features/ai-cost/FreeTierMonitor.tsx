import { CircleHelp } from "lucide-react";
import type { AICostData } from "@/types/business";
export function FreeTierMonitor({
  providers,
}: {
  providers: AICostData["providers"];
}) {
  return (
    <section className="free-tier-monitor glass">
      <div className="business-panel-heading">
        <div>
          <span>LIMITS NOT VERIFIED</span>
          <h2>Free-tier monitoring</h2>
        </div>
        <CircleHelp size={17} />
      </div>
      {providers.map((p) => (
        <article key={p.id}>
          <strong>{p.name}</strong>
          <span>Configured limit: {p.configuredLimit ?? "NOT VERIFIED"}</span>
          <span>
            Current usage:{" "}
            {p.usagePercent === null ? "UNAVAILABLE" : `${p.usagePercent}%`}
          </span>
          <span>Source: {p.source}</span>
        </article>
      ))}
    </section>
  );
}
