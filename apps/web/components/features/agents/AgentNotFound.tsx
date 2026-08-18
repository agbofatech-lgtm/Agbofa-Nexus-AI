import { ArrowLeft, BotOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui";

interface AgentNotFoundProps {
  error?: string;
  onRetry?: () => void;
}

export function AgentNotFound({ error, onRetry }: AgentNotFoundProps) {
  return (
    <section
      className="agent-not-found glass"
      role={error ? "alert" : "status"}
    >
      <span>
        <BotOff size={27} />
      </span>
      <small>Canonical agent registry</small>
      <h1>
        {error ? "Agent telemetry could not be loaded." : "Agent not found."}
      </h1>
      <p>
        {error ??
          "This ID is not defined in docs/indexes/json/agents.json. AGT-029 through AGT-032 are not currently registered."}
      </p>
      <div>
        {error && onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
        <Link href="/agents">
          <ArrowLeft size={15} /> Back to Agents
        </Link>
      </div>
    </section>
  );
}
