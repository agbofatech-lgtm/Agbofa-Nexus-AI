"use client";

import { CheckCircle2, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui";
import type { PersonalizationControlSettings } from "@/types/personalization-intelligence";

interface PersonalizationSettingsProps {
  settings: PersonalizationControlSettings;
  onChange: (settings: Partial<PersonalizationControlSettings>) => void;
}

const controls = [
  {
    key: "sensitivity",
    label: "Recommendation sensitivity",
    detail: "How strongly demo rankings respond to affinity signals",
  },
  {
    key: "topicWeighting",
    label: "Topic weighting",
    detail: "Relative influence of explicit topic preferences",
  },
  {
    key: "diversity",
    label: "Content diversity",
    detail: "How far recommendations move beyond primary interests",
  },
  {
    key: "personalizationLevel",
    label: "Personalization level",
    detail: "Overall intensity of local demo personalization",
  },
] as const;

export function PersonalizationSettings({
  settings,
  onChange,
}: PersonalizationSettingsProps) {
  const [saved, setSaved] = useState(false);
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  return (
    <section className="personalization-settings glass-gold">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <SlidersHorizontal size={12} /> Frontend demo controls
          </span>
          <h2>Personalization settings</h2>
        </div>
        <span>Local state only</span>
      </div>
      <div>
        {controls.map((control) => (
          <label key={control.key}>
            <span>
              <strong>{control.label}</strong>
              <small>{control.detail}</small>
            </span>
            <input
              aria-label={control.label}
              max={100}
              min={0}
              onChange={(event) =>
                onChange({ [control.key]: Number(event.target.value) })
              }
              type="range"
              value={settings[control.key]}
            />
            <b>{settings[control.key]}%</b>
          </label>
        ))}
      </div>
      <footer>
        <span aria-live="polite">
          {saved
            ? "Demo settings saved in current frontend state."
            : "No server persistence endpoint is available."}
        </span>
        <Button onClick={save} size="sm">
          {saved ? <CheckCircle2 size={13} /> : null} Save demo settings
        </Button>
      </footer>
    </section>
  );
}
