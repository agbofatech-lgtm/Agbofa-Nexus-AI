"use client";
import { CheckCircle2, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import type { AdminData } from "@/types/business";
export function AdminSettings({ initial }: { initial: AdminData["settings"] }) {
  const [settings, setSettings] = useState(initial);
  const [msg, setMsg] = useState("");
  return (
    <section className="admin-settings glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO SETTINGS</span>
          <h2>Workspace settings</h2>
        </div>
        <Settings2 size={17} />
      </div>
      <Input
        label="Brand name"
        onChange={(brandName) => setSettings((s) => ({ ...s, brandName }))}
        value={settings.brandName}
      />
      <Input
        label="Locale"
        onChange={(locale) => setSettings((s) => ({ ...s, locale }))}
        value={settings.locale}
      />
      <button
        aria-pressed={settings.reviewRequired}
        onClick={() =>
          setSettings((s) => ({ ...s, reviewRequired: !s.reviewRequired }))
        }
        type="button"
      >
        {settings.reviewRequired ? <CheckCircle2 size={13} /> : null}Human
        review required
      </button>
      <footer>
        <span aria-live="polite">
          {msg || "No administration persistence endpoint exists."}
        </span>
        <Button
          onClick={() => {
            setMsg("Demo settings saved locally.");
            window.setTimeout(() => setMsg(""), 2200);
          }}
          size="sm"
        >
          Save demo settings
        </Button>
      </footer>
    </section>
  );
}
