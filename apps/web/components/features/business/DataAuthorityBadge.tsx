import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  FlaskConical,
  HelpCircle,
  LoaderCircle,
  MinusCircle,
} from "lucide-react";

import type { DataAuthorityState } from "@/types/data-state";

const config = {
  live: { label: "Live source", icon: CheckCircle2 },
  demo: { label: "Development", icon: FlaskConical },
  unavailable: { label: "Not connected", icon: DatabaseZap },
  not_verified: { label: "Not verified", icon: HelpCircle },
  error: { label: "Data error", icon: AlertTriangle },
  loading: { label: "Loading", icon: LoaderCircle },
  empty: { label: "No data yet", icon: MinusCircle },
} as const;

export function DataAuthorityBadge({ state }: { state: DataAuthorityState }) {
  const item = config[state];
  const Icon = item.icon;
  return (
    <span className={`data-authority data-authority--${state}`}>
      <Icon size={11} />
      {item.label}
    </span>
  );
}
