import { Bot, DatabaseZap, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui";

interface AgentHeaderProps {
  count: number;
  title?: string;
  description?: string;
}

export function AgentHeader({
  count,
  title = "Agent Workforce",
  description = "Control center for the canonical Nexus AI agent registry.",
}: AgentHeaderProps) {
  return (
    <header className="agents-header">
      <div>
        <span className="agents-header__eyebrow">
          <Bot size={13} /> Enterprise AI operations
        </span>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>
          {count} registered AI agents · {description}
        </p>
      </div>
      <div className="agents-header__labels">
        <Badge status="queued">
          <DatabaseZap size={11} /> Demo telemetry
        </Badge>
        <Badge verification="unverified" variant="verification">
          <ShieldCheck size={11} /> Runtime not connected
        </Badge>
      </div>
    </header>
  );
}
