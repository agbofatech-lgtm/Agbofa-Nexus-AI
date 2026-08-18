import { CirclePause, Clock3, PlayCircle } from "lucide-react";

import type { Agent, AgentTask } from "@/types/agents";

interface AgentTaskPanelProps {
  task?: AgentTask;
  agentStatus: Agent["status"];
  telemetryEnd?: Date;
}

function durationLabel(startedAt: Date, end: Date): string {
  const seconds = Math.max(
    0,
    Math.floor((end.getTime() - startedAt.getTime()) / 1000),
  );
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

export function AgentTaskPanel({
  task,
  agentStatus,
  telemetryEnd,
}: AgentTaskPanelProps) {
  return (
    <section
      className="agent-task-panel glass-gold"
      aria-labelledby="current-task-title"
    >
      <div className="agent-panel-heading">
        <div>
          <span className="section-kicker">Demo task state</span>
          <h2 id="current-task-title">Current task</h2>
        </div>
        {task ? <PlayCircle size={18} /> : <CirclePause size={18} />}
      </div>
      {task ? (
        <div className="agent-task">
          <strong>{task.title}</strong>
          <span>Simulated task · {task.progress}% complete</span>
          <i>
            <b style={{ width: `${task.progress}%` }} />
          </i>
          <dl>
            <div>
              <dt>Started</dt>
              <dd>
                {new Intl.DateTimeFormat("en", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(task.startedAt)}
              </dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>
                <Clock3 size={11} />{" "}
                {durationLabel(task.startedAt, telemetryEnd ?? task.startedAt)}
              </dd>
            </div>
            <div>
              <dt>Estimate</dt>
              <dd>{Math.ceil(task.estimatedDurationSeconds / 60)} min</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="agent-task-empty">
          <CirclePause size={24} />
          <strong>No active task</strong>
          <p>Agent is currently {agentStatus}. No live runtime is connected.</p>
        </div>
      )}
    </section>
  );
}
