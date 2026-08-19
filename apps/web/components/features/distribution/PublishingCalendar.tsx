import { CalendarDays } from "lucide-react";
import type { DistributionData } from "@/types/business";
export function PublishingCalendar({
  items,
}: {
  items: DistributionData["calendar"];
}) {
  return (
    <section className="publishing-calendar glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO SCHEDULE</span>
          <h2>Publishing calendar</h2>
        </div>
        <CalendarDays size={17} />
      </div>
      <div>
        {items.map((item) => (
          <article key={item.id}>
            <span>{item.scheduledFor}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.channel}</small>
            </div>
            <b>{item.state}</b>
          </article>
        ))}
      </div>
    </section>
  );
}
