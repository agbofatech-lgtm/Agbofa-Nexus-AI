"use client";

import { CircleHelp, TrendingUp } from "lucide-react";
import { useState } from "react";
import { TruthStateBadge } from "@/components/features/phase3/TruthStateBadge";
import { ConfidenceBadge } from "@/components/shared/states";
import type { ForecastRecord } from "@/types/phase3-experience";

export function ForecastingView({ forecasts }: { forecasts: ForecastRecord[] }) {
  const [selected, setSelected] = useState<30 | 60 | 90>(30);
  const current = forecasts.find((item) => item.horizonDays === selected) ?? forecasts[0];
  if (!current) return null;
  return (
    <div className="phase3-stack">
      <section className="forecast-control">
        <div><span>HORIZON</span><h2>Range before promise</h2></div>
        <div role="tablist" aria-label="Forecast horizon">
          {([30, 60, 90] as const).map((days) => <button aria-selected={selected === days} key={days} onClick={() => setSelected(days)} role="tab" type="button">{days} days</button>)}
        </div>
      </section>
      <article className="forecast-detail">
        <header><div><span>{current.scenario} SCENARIO · {current.horizonDays} DAYS</span><h2>{current.metric}</h2></div><div><TruthStateBadge state="FORECAST" /><ConfidenceBadge confidence={current.confidence} /></div></header>
        <figure>
          <figcaption>Forecast range: {current.range.minimum} to {current.range.maximum} {current.range.unit}. This is not a guaranteed outcome.</figcaption>
          <div
            aria-label={`${current.horizonDays}-day ${current.scenario.toLowerCase()} forecast from ${current.range.minimum} to ${current.range.maximum} ${current.range.unit}`}
            className="forecast-range"
            role="img"
          >
            <span style={{ left: `${current.range.minimum}%`, width: `${current.range.maximum - current.range.minimum}%` }}><i /><i /></span>
          </div>
          <div className="forecast-scale" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        </figure>
        <section><h3>Assumptions</h3><ol>{current.assumptions.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></section>
        <footer><CircleHelp aria-hidden="true" size={16} /><p>Confidence describes the deterministic scenario model, not certainty. Scenario is planning context—not the disabled Strategy Scenario Simulator.</p></footer>
      </article>
      <section className="forecast-comparison" aria-label="Forecast comparison table">
        {forecasts.map((forecast) => (
          <article key={forecast.id}><TrendingUp aria-hidden="true" /><span>{forecast.horizonDays} DAYS · {forecast.scenario}</span><strong>{forecast.range.minimum}–{forecast.range.maximum}</strong><small>{forecast.range.unit} · {forecast.confidence.score}% confidence</small></article>
        ))}
      </section>
    </div>
  );
}
