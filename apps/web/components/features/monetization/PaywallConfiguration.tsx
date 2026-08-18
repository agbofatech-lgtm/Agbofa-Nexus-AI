"use client";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import type { MonetizationData } from "@/types/business";
export function PaywallConfiguration({
  initial,
}: {
  initial: MonetizationData["paywall"];
}) {
  const [config, setConfig] = useState(initial);
  const [msg, setMsg] = useState("");
  const toggle = (
    key: "registrationGate" | "subscriptionGate" | "meteredAccess",
  ) => setConfig((v) => ({ ...v, [key]: !v[key] }));
  return (
    <section className="paywall-config glass-gold">
      <div className="business-panel-heading">
        <div>
          <span>DEMO CONFIGURATION</span>
          <h2>Paywall configuration</h2>
        </div>
        <LockKeyhole size={18} />
      </div>
      <div className="paywall-fields">
        <Input
          label="Free articles / month"
          onChange={(v) =>
            setConfig((c) => ({ ...c, freeArticles: Number(v) || 0 }))
          }
          value={String(config.freeArticles)}
        />
        <Input
          label="Preview length %"
          onChange={(v) =>
            setConfig((c) => ({ ...c, previewLength: Number(v) || 0 }))
          }
          value={String(config.previewLength)}
        />
      </div>
      <div className="paywall-toggles">
        {(
          ["registrationGate", "subscriptionGate", "meteredAccess"] as const
        ).map((key) => (
          <button
            aria-pressed={config[key]}
            key={key}
            onClick={() => toggle(key)}
            type="button"
          >
            {config[key] ? <CheckCircle2 size={13} /> : null}
            {key.replace(/([A-Z])/g, " $1")}
          </button>
        ))}
      </div>
      <footer>
        <span aria-live="polite">
          {msg || "Backend persistence unavailable."}
        </span>
        <Button
          onClick={() => {
            setMsg("Demo configuration saved in local component state.");
            window.setTimeout(() => setMsg(""), 2200);
          }}
          size="sm"
        >
          Save demo config
        </Button>
      </footer>
    </section>
  );
}
