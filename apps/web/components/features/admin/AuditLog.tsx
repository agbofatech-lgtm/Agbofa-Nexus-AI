import type { AdminData } from "@/types/business";
export function AuditLog({ items }: { items: AdminData["audit"] }) {
  return (
    <section className="audit-log glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO AUDIT</span>
          <h2>Audit log</h2>
        </div>
      </div>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.action}</span>
            <strong>{item.actor}</strong>
            <p>{item.target}</p>
            <b>{item.result}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}
