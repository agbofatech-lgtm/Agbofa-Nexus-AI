import {
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Settings2,
} from "lucide-react";

import { HealthGauge } from "@/components/features/ai-control/HealthGauge";
import { Badge } from "@/components/ui";
import type { AIProvider } from "@/types/ai-control";

const icons = {
  connected: CheckCircle2,
  degraded: AlertTriangle,
  offline: CircleOff,
  "not-configured": Settings2,
} as const;

export function ProviderStatus({
  provider,
  selected,
  onSelect,
}: {
  provider: AIProvider;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const Icon = icons[provider.state];
  return (
    <button
      aria-pressed={selected}
      className={
        selected
          ? `provider-card provider-card--${provider.state} provider-card--selected glass-card`
          : `provider-card provider-card--${provider.state} glass-card`
      }
      onClick={() => onSelect(provider.id)}
      type="button"
    >
      <div className="provider-card__heading">
        <span>
          <Icon size={17} />
        </span>
        <div>
          <strong>{provider.name}</strong>
          <small>Example provider state</small>
        </div>
        <Badge
          status={
            provider.state === "connected"
              ? "running"
              : provider.state === "degraded"
                ? "degraded"
                : provider.state === "offline"
                  ? "failed"
                  : "disabled"
          }
        >
          {provider.state}
        </Badge>
      </div>
      <HealthGauge label="demo health" value={provider.health} />
      <dl>
        <div>
          <dt>Latency</dt>
          <dd>{provider.latency ? `${provider.latency}ms` : "N/A"}</dd>
        </div>
        <div>
          <dt>Error rate</dt>
          <dd>{provider.errorRate}%</dd>
        </div>
        <div>
          <dt>Requests</dt>
          <dd>{provider.requestCount.toLocaleString()}</dd>
        </div>
      </dl>
      <footer>
        <span>DEMO</span>
        <p>{provider.fallbackState}</p>
      </footer>
    </button>
  );
}
