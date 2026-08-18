"use client";
import { CalendarDays, Download } from "lucide-react";
import { useState } from "react";
import { Button, Select } from "@/components/ui";
const ranges = ["7D", "30D", "90D", "1Y", "CUSTOM"] as const;
export function AnalyticsControls() {
  const [range, setRange] = useState<(typeof ranges)[number]>("30D");
  const [msg, setMsg] = useState("");
  return (
    <section className="analytics-controls glass">
      <div role="tablist" aria-label="Analytics time range">
        {ranges.map((r) => (
          <button
            aria-selected={r === range}
            key={r}
            onClick={() => setRange(r)}
            role="tab"
            type="button"
          >
            {r}
          </button>
        ))}
      </div>
      <Select
        aria-label="Channel filter"
        options={[
          { value: "all", label: "All channels" },
          { value: "brand", label: "Brand channels" },
          { value: "personal", label: "Personal channels" },
        ]}
        value="all"
      />
      <Select
        aria-label="Category filter"
        options={[
          { value: "all", label: "All categories" },
          { value: "ai", label: "AI" },
          { value: "ghana", label: "Ghana" },
          { value: "business", label: "Business" },
        ]}
        value="all"
      />
      <Button
        onClick={() =>
          setMsg("Export integration required. No file was generated.")
        }
        size="sm"
        variant="ghost"
      >
        <Download size={13} /> CSV / PDF
      </Button>
      <span aria-live="polite">
        {msg || (
          <>
            <CalendarDays size={12} />
            {range} demo window
          </>
        )}
      </span>
    </section>
  );
}
