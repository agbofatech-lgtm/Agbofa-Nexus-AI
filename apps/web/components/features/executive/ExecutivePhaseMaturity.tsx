import type { ExecutivePhaseStatus } from "@/types/executive-command";

export function ExecutivePhaseMaturity({ phases }: { phases: ExecutivePhaseStatus[] }) {
  return (
    <section className="executive-phases" aria-labelledby="executive-phases-title">
      <header>
        <div>
          <span>SYSTEM MATURITY</span>
          <h2 id="executive-phases-title">Phase status is informational</h2>
        </div>
        <p>This surface cannot certify or recertify previous phases. Previous evidence remains authoritative.</p>
      </header>
      <ol>
        {phases.map((phase) => (
          <li key={phase.id}>
            <strong>{phase.id.replaceAll("_", " ")}</strong>
            <b className={`executive-phase-status executive-phase-status--${phase.status.toLowerCase().replaceAll(" ", "-")}`}>
              {phase.status}
            </b>
            <p>{phase.note}</p>
            <small>{phase.label} · read-only</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
