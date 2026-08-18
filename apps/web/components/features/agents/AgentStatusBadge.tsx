import { Badge } from "@/components/ui";
import type { AgentStatus } from "@/types/agents";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  return <Badge status={status}>{status}</Badge>;
}
