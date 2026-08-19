import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui";

interface AgentErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function AgentErrorState({ message, onRetry }: AgentErrorStateProps) {
  return (
    <section className="agent-state agent-state--error glass" role="alert">
      <span>
        <AlertTriangle size={24} />
      </span>
      <div>
        <strong>Agent workforce unavailable.</strong>
        <p>{message}</p>
      </div>
      <Button onClick={onRetry} size="sm">
        <RefreshCw size={13} /> Retry
      </Button>
    </section>
  );
}
