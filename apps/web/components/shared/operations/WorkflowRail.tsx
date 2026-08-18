import {
  AlertTriangle,
  Check,
  Circle,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import type { WorkflowStage, WorkflowStatus } from "@/types/operations";
const icons: Record<WorkflowStatus, typeof Circle> = {
  queued: Clock3,
  running: LoaderCircle,
  waiting: Clock3,
  review: ShieldCheck,
  completed: Check,
  failed: X,
  degraded: AlertTriangle,
  unavailable: Circle,
};
export function WorkflowRail({
  title,
  eyebrow = "Operating workflow",
  stages,
  description,
  loop = false,
}: {
  title: string;
  eyebrow?: string;
  stages: readonly WorkflowStage[];
  description?: string;
  loop?: boolean;
}) {
  const id = `${title.replaceAll(" ", "-").toLowerCase()}-workflow-title`;
  return (
    <section className="workflow-rail" aria-labelledby={id}>
      <header>
        <div>
          <span>{eyebrow}</span>
          <h2 id={id}>{title}</h2>
        </div>
        {description ? <p>{description}</p> : null}
      </header>
      <ol className="workflow-rail__track">
        {stages.map((s, index) => {
          const Icon = icons[s.status];
          return (
            <li
              key={s.id}
              className={`workflow-node workflow-node--${s.status}`}
            >
              <span className="workflow-node__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="workflow-node__icon" aria-hidden="true">
                <Icon size={15} />
              </span>
              <div>
                <strong>{s.label}</strong>
                <small>{s.owner ?? s.status}</small>
                {s.detail ? <p>{s.detail}</p> : null}
              </div>
              {typeof s.count === "number" ? <b>{s.count}</b> : null}
              {index < stages.length - 1 || loop ? (
                <i aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
