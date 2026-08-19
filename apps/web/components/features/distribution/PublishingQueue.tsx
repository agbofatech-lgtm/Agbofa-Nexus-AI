"use client";

import { AlertTriangle, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  PublishingPlan,
  PublishingState,
  PublishingTransition,
} from "@/types/phase3-experience";

const filters = ["ALL", "REVIEW", "SCHEDULED", "FAILED", "RETRYING"] as const;
type Filter = (typeof filters)[number];

export function PublishingQueue({
  plans,
  transitions,
}: {
  plans: PublishingPlan[];
  transitions: PublishingTransition[];
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [localStates, setLocalStates] = useState<Record<string, PublishingState>>({});
  const [message, setMessage] = useState(
    "Queue states are simulated. No provider mutation is possible.",
  );
  const visible = useMemo(
    () =>
      plans.filter((plan) => {
        const state = localStates[plan.id] ?? plan.state;
        return filter === "ALL" || state === filter;
      }),
    [filter, localStates, plans],
  );
  const transition = (plan: PublishingPlan, state: PublishingState) => {
    setLocalStates((current) => ({ ...current, [plan.id]: state }));
    setMessage(
      `${plan.platform} plan moved to ${state} locally. No content was sent, approved externally, scheduled with, or retried against a provider.`,
    );
  };
  return (
    <div className="phase3-stack">
      <section className="queue-control">
        <div role="tablist" aria-label="Publishing queue filters">
          {filters.map((item) => (
            <button
              aria-selected={filter === item}
              key={item}
              onClick={() => setFilter(item)}
              role="tab"
              type="button"
            >{item}</button>
          ))}
        </div>
        <span aria-live="polite"><ShieldCheck aria-hidden="true" size={13} /> {message}</span>
      </section>

      <section className="queue-list" aria-label="Simulated publishing plans">
        {visible.length ? visible.map((plan) => {
          const state = localStates[plan.id] ?? plan.state;
          return (
            <article key={plan.id}>
              <div className="queue-list__index"><span>{plan.platform.slice(0, 2).toUpperCase()}</span><small>{plan.id}</small></div>
              <div className="queue-list__story">
                <span>{plan.storyId} · {plan.truth}</span>
                <h2>{plan.title}</h2>
                <p>{plan.note}</p>
              </div>
              <div className="queue-list__state">
                <span className={`publishing-state publishing-state--${state.toLowerCase()}`}>{state}</span>
                <small>{plan.plannedFor ?? "No external schedule"}</small>
                <small>Owner: {plan.approvalOwner}</small>
              </div>
              <div className="queue-list__action">
                {state === "REVIEW" ? (
                  <button onClick={() => transition(plan, "APPROVED")} type="button"><CheckCircle2 aria-hidden="true" size={12} /> Simulate approval</button>
                ) : state === "FAILED" ? (
                  <button onClick={() => transition(plan, "RETRYING")} type="button"><RotateCcw aria-hidden="true" size={12} /> Plan retry</button>
                ) : state === "READY" ? (
                  <button onClick={() => transition(plan, "REVIEW")} type="button"><ShieldCheck aria-hidden="true" size={12} /> Send to local review</button>
                ) : (
                  <span>No external action</span>
                )}
                {plan.failureReason ? <small><AlertTriangle aria-hidden="true" size={11} /> {plan.failureReason}</small> : null}
              </div>
            </article>
          );
        }) : <div className="queue-empty"><strong>No plans in this state</strong><p>Choose another queue filter.</p></div>}
      </section>

      <section className="state-legend" aria-label="Supported publishing states">
        <h2>Publishing state machine</h2>
        <div>{transitions.map((item) => <span className={`publishing-state publishing-state--${item.state.toLowerCase()}`} key={item.state}>{item.state}</span>)}</div>
        <p>Every state has externalEffect=false. PUBLISHED is a state-machine demonstration and never evidence of external delivery.</p>
      </section>
    </div>
  );
}
