"use client";
import { CalendarClock, CheckCircle2, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { ContentPreview } from "@/components/features/distribution/ContentPreview";
import { Button, Input } from "@/components/ui";
import { useDistributionAdaptation } from "@/hooks/useDistributionAdaptation";
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
  const selectedChannels = channels.filter((c) => selected.includes(c.id));
  const previews = useDistributionAdaptation(content, selectedChannels);
  const toggle = (id: string) => {
    setMessage("");
    setSelected((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  };
  const save = () =>
    setMessage(
      selectedChannels.some((c) => c.type === "personal")
        ? "Plan saved locally. Personal channels require manual distribution."
        : "Plan saved locally. Publishing and scheduling integrations are not connected.",
    );
  return (
    <section className="publishing-composer glass-gold">
      <div className="business-panel-heading">
        <div>
          <span>LOCAL ADAPTATION STUDIO</span>
          <h2>One story, channel-aware presentations</h2>
        </div>
        <b>{selected.length} selected</b>
      </div>
      <p className="publishing-composer__intro">
        Prepare deterministic platform templates for editorial comparison. This
        does not call an AI provider, connect an account, or publish content.
      </p>
      <textarea
        aria-label="Master story or distribution brief"
        maxLength={1200}
        onChange={(e) => {
          setContent(e.target.value);
          setMessage("");
        }}
        placeholder="Paste the master story angle or approved distribution brief…"
        value={content}
      />
      <div className="composer-channels" aria-label="Adaptation channels">
        {channels.map((c) => (
          <button
            aria-pressed={selected.includes(c.id)}
            key={c.id}
            onClick={() => toggle(c.id)}
            type="button"
          >
            {c.platform}
            <small>{c.type === "personal" ? "manual" : "not connected"}</small>
          </button>
        ))}
      </div>
      <Input
        label="Planned schedule"
        onChange={(v) => {
          setScheduled(v);
          setMessage("");
        }}
        placeholder="e.g. Monday 07:00 GMT"
        value={scheduled}
      />
      {previews.length ? (
        <section
          className="platform-preview-studio"
          aria-labelledby="platform-preview-title"
        >
          <div className="platform-preview-studio__heading">
            <div>
              <span>
                <Sparkles size={13} /> Local template adapter
              </span>
              <h3 id="platform-preview-title">Compare channel outputs</h3>
            </div>
            <small>
              {previews.length} previews · editorial approval required
            </small>
          </div>
          <div className="platform-preview-grid">
            {previews.map((p) => (
              <ContentPreview key={p.channelId} preview={p} />
            ))}
          </div>
        </section>
      ) : (
        <div className="platform-preview-empty">
          <Sparkles size={18} />
          <span>
            Select channels and enter a master brief to compare templates.
          </span>
        </div>
      )}
      <Button disabled={!content || !selected.length} onClick={save}>
        <CalendarClock size={14} /> Save local plan
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
            No social API or OAuth connection will be used.
          </>
        )}
      </span>
    </section>
  );
}
