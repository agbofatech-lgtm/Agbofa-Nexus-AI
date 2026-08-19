import { Repeat2, Target } from "lucide-react";
import type { GrowthData } from "@/types/business";
export function ConversionRetention({
  channels,
}: {
  channels: GrowthData["channelComparison"];
}) {
  return (
    <section className="conversion-retention glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO INTELLIGENCE</span>
          <h2>Conversion & retention</h2>
        </div>
      </div>
      <div>
        {channels.map((c) => (
          <article key={`${c.audience}-${c.channel}`}>
            <span>
              {c.audience === "personal" ? (
                <Repeat2 size={14} />
              ) : (
                <Target size={14} />
              )}
            </span>
            <div>
              <strong>{c.channel}</strong>
              <small>{c.audience} audience</small>
            </div>
            <b>
              {c.conversion}%<small>conversion</small>
            </b>
            <b>
              {c.retention}%<small>retention</small>
            </b>
          </article>
        ))}
      </div>
    </section>
  );
}
