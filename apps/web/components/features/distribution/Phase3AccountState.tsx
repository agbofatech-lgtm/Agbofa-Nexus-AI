import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  KeyRound,
  MinusCircle,
  UserRound,
} from "lucide-react";
import type { DistributionAccountState } from "@/types/phase3-experience";

const icons = {
  CONNECTED: CheckCircle2,
  PENDING: Clock3,
  DEGRADED: AlertTriangle,
  NOT_CREATED: MinusCircle,
  MANUAL: UserRound,
  REQUIRES_AUTHORIZATION: KeyRound,
} as const;

export function Phase3AccountState({ state }: { state: DistributionAccountState }) {
  const Icon = icons[state];
  return (
    <span className={`account-state account-state--${state.toLowerCase()}`}>
      <Icon aria-hidden="true" size={11} />
      {state.replaceAll("_", " ")}
    </span>
  );
}
