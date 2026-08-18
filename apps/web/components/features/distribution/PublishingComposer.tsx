"use client";
import { CalendarClock, CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { ContentPreview } from "@/components/features/distribution/ContentPreview";
import { Button, Input } from "@/components/ui";
import type { DistributionChannel } from "@/types/business";
export function PublishingComposer({
  channels,
}: {
  channels: DistributionChannel[];
}) {
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [scheduled, setScheduled] = useState("");
  const [message, setMessage] = useState("");
  const toggle = (id: string) =>
    setSelected((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  const submit = () => {
    setMessage(
      selected.some(
        (id) => channels.find((c) => c.id === id)?.type === "personal",
      )
        ? "Demo schedule saved. Founder channels require manual distribution."
        : "Demo schedule saved locally. Backend publishing integration required.",
    );
  };
  const first = channels.find((c) => c.id === selected[0]);
  return (
    <section className="publishing-composer glass-gold">
      <div className="business-panel-heading">
        <div>
          <span>FRONTEND DEMO</span>
          <h2>Publishing composer</h2>
        </div>
        <b>{content.length}/280</b>
      </div>
      <textarea
        aria-label="Distribution content"
        maxLength={280}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Compose a demo distribution message..."
        value={content}
      />
      <div className="composer-channels">
        {channels.map((c) => (
          <button
            aria-pressed={selected.includes(c.id)}
            key={c.id}
            onClick={() => toggle(c.id)}
            type="button"
          >
            {c.platform}
            <small>{c.type === "personal" ? "manual" : "not verified"}</small>
          </button>
        ))}
      </div>
      <Input
        label="Demo schedule"
        onChange={setScheduled}
        placeholder="e.g. Monday 07:00 GMT"
        value={scheduled}
      />
      <ContentPreview channel={first?.platform ?? ""} content={content} />
      <Button disabled={!content || !selected.length} onClick={submit}>
        <CalendarClock size={14} /> Schedule demo
      </Button>
      <span aria-live="polite">
        {message ? (
          <>
            <CheckCircle2 size={13} />
            {message}
          </>
        ) : (
          <>
            <Send size={13} />
            No social API call will be made.
          </>
        )}
      </span>
    </section>
  );
}
