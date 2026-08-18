import { ArrowRight, Network } from "lucide-react";

import type { CrossMediaRelationship } from "@/types/multimodal";

export function CrossMediaView({
  relationships,
}: {
  relationships: CrossMediaRelationship[];
}) {
  return (
    <section className="cross-media glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <Network size={12} /> Demo relationship graph
          </span>
          <h2>Cross-media intelligence</h2>
        </div>
      </div>
      <div>
        {relationships.map((item) => (
          <article key={item.id}>
            <span>{item.from}</span>
            <ArrowRight size={15} />
            <span>{item.to}</span>
            <div>
              <strong>{item.relationship}</strong>
              <small>{item.confidence}% example confidence</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
