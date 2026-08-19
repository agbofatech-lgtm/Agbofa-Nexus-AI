"use client";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import type { AICostData } from "@/types/business";
export function BudgetAlerts({ initial }: { initial: AICostData["budget"] }) {
  const [b, setB] = useState(initial);
  const [msg, setMsg] = useState("");
  return (
    <section className="budget-alerts glass-gold">
      <div className="business-panel-heading">
        <div>
          <span>DEMO CONFIGURATION</span>
          <h2>Budget alerts</h2>
        </div>
        <AlertTriangle size={17} />
      </div>
      <div>
        <Input
          label="Daily budget ($)"
          onChange={(v) => setB((x) => ({ ...x, daily: Number(v) || 0 }))}
          value={String(b.daily)}
        />
        <Input
          label="Monthly budget ($)"
          onChange={(v) => setB((x) => ({ ...x, monthly: Number(v) || 0 }))}
          value={String(b.monthly)}
        />
        <Input
          label="Warning threshold %"
          onChange={(v) =>
            setB((x) => ({ ...x, warningThreshold: Number(v) || 0 }))
          }
          value={String(b.warningThreshold)}
        />
        <Input
          label="Critical threshold %"
          onChange={(v) =>
            setB((x) => ({ ...x, criticalThreshold: Number(v) || 0 }))
          }
          value={String(b.criticalThreshold)}
        />
      </div>
      <footer>
        <span aria-live="polite">
          {msg || "No operational alerting backend exists."}
        </span>
        <Button
          onClick={() => {
            setMsg("Demo thresholds saved locally.");
            window.setTimeout(() => setMsg(""), 2200);
          }}
          size="sm"
        >
          {msg ? <CheckCircle2 size={13} /> : null}Save demo thresholds
        </Button>
      </footer>
    </section>
  );
}
