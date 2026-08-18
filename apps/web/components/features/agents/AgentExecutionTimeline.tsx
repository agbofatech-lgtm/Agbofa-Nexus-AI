import { AlertTriangle, CheckCircle2, Clock3, XCircle } from "lucide-react";

import type { AgentExecution } from "@/types/agents";

interface AgentExecutionTimelineProps {
  executions: AgentExecution[];
}

const executionIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  failure: XCircle,
} as const;

export function AgentExecutionTimeline({
  executions,
}: AgentExecutionTimelineProps) {
  return (
    <section
      className="agent-executions glass"
      aria-labelledby="agent-executions-title"
    >
      <div className="agent-panel-heading">
        <div>
          <span className="section-kicker">Demo execution history</span>
          <h2 id="agent-executions-title">Execution timeline</h2>
        </div>
        <span>{executions.length} simulated runs</span>
      </div>
      <ol>
        {executions.map((execution) => {
          const Icon = executionIcons[execution.status];
          return (
            <li
              key={execution.id}
              className={`agent-execution agent-execution--${execution.status}`}
            >
              <span>
                <Icon size={14} />
              </span>
              <time dateTime={execution.startedAt.toISOString()}>
                {new Intl.DateTimeFormat("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(execution.startedAt)}
              </time>
              <strong>{execution.status}</strong>
              <p>{execution.summary}</p>
              <b>
                <Clock3 size={11} /> {execution.durationMs}ms
              </b>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
