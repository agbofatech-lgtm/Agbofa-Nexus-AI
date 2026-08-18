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
  live: { label: "LIVE", icon: CheckCircle2 },
  demo: { label: "DEMO DATA", icon: FlaskConical },
  unavailable: { label: "BACKEND INTEGRATION REQUIRED", icon: DatabaseZap },
  not_verified: { label: "NOT VERIFIED", icon: HelpCircle },
  error: { label: "DATA ERROR", icon: AlertTriangle },
  loading: { label: "LOADING", icon: LoaderCircle },
  empty: { label: "NO DATA YET", icon: MinusCircle },
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
