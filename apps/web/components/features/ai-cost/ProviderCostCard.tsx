import { DataAuthorityBadge } from "@/components/features/business/DataAuthorityBadge";
import type { AICostData } from "@/types/business";
export function ProviderCostCard({
  provider,
}: {
  provider: AICostData["providers"][number];
}) {
  const authority =
    provider.state === "demo"
      ? "demo"
      : provider.state === "not-verified"
        ? "not_verified"
        : "unavailable";
  return (
    <article className="provider-cost-card glass-card">
      <div>
        <strong>{provider.name}</strong>
        <DataAuthorityBadge state={authority} />
      </div>
      <dl>
        <div>
          <dt>Cost</dt>
          <dd>
            {provider.cost === null
              ? "—"
              : `$${provider.cost.toLocaleString()}`}
          </dd>
        </div>
        <div>
          <dt>Requests</dt>
          <dd>{provider.requests?.toLocaleString() ?? "—"}</dd>
        </div>
        <div>
          <dt>Tokens</dt>
          <dd>
            {provider.tokens === null
              ? "—"
              : `${(provider.tokens / 1e6).toFixed(1)}M`}
          </dd>
        </div>
      </dl>
      <footer>
        <span>
          Free-tier limit: {provider.configuredLimit ?? "NOT VERIFIED"}
        </span>
        <p>{provider.source}</p>
      </footer>
    </article>
  );
}
