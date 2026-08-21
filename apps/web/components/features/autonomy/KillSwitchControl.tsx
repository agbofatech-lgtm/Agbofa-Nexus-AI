"use client";

import { AlertOctagon, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { useRef, useState } from "react";
import { ExecutionRealityBadge } from "@/components/shared/states/ExecutionRealityBadge";
import type {
  AutonomyAuditRecord,
  KillSwitchState,
  Phase5ExperienceData,
} from "@/types/phase5-experience";

export function KillSwitchControl({
  initial,
  onAudit,
}: {
  initial: Phase5ExperienceData["killSwitch"];
  onAudit: (record: AutonomyAuditRecord) => void;
}) {
  const [state, setState] = useState<KillSwitchState>(initial.state);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string>(initial.disclosure);
  const auditSequence = useRef(0);
  const addAudit = (
    action: string,
    previousState: KillSwitchState,
    resultingState: KillSwitchState,
    reason: string,
  ) =>
    onAudit({
      id: `local-kill-${++auditSequence.current}`,
      action,
      target: "AUTONOMY_SIMULATION",
      actor: "Demo autonomy reviewer",
      timestamp: new Date().toISOString(),
      previousState,
      resultingState,
      reason,
      provenance: initial.provenance,
      executionReality: "SIMULATED",
    });
  const request = () => {
    addAudit(
      "REQUEST_SIMULATED_STOP",
      state,
      "SIMULATED_STOP_REQUESTED",
      "User opened the deliberate simulation-only emergency transition.",
    );
    setState("SIMULATED_STOP_REQUESTED");
    setConfirming(true);
    setMessage("Simulated stop requested locally. Confirm to demonstrate the final UI transition; no backend is affected.");
  };
  const confirm = () => {
    void fetch("/api/v1/autonomy/kill-switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ engage: true }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as { kill_switch?: string; error?: string };
        if (!response.ok) {
          setMessage(`Kill-switch persist failed (${payload.error ?? response.status}). Local UI unchanged as authority.`);
          return;
        }
        addAudit(
          "APPLY_KILL_SWITCH",
          state,
          payload.kill_switch === "ENGAGED" ? "SIMULATED_STOP_APPLIED" : state,
          "Persisted tenant kill-switch ENGAGED. Blocks autonomy dispatch and Phase 04 schedule for this tenant.",
        );
        setState("SIMULATED_STOP_APPLIED");
        setConfirming(false);
        setMessage("Kill-switch ENGAGED in backend for this tenant. Publishing schedule and autonomy dispatch are blocked. Not a process SIGKILL.");
      })
      .catch(() => setMessage("Kill-switch request failed. Backend not reached."));
  };
  const cancel = () => {
    addAudit(
      "CANCEL_SIMULATED_STOP",
      state,
      "ARMED",
      "User cancelled the local simulation-only stop request.",
    );
    setState("ARMED");
    setConfirming(false);
    setMessage("Simulated stop request cancelled. Backend enforcement remains unavailable.");
  };
  return (
    <section className="kill-switch" aria-labelledby="kill-switch-title">
      <header><div><span>SIMULATED EMERGENCY CONTROL</span><h2 id="kill-switch-title">Kill-switch UX</h2></div><ExecutionRealityBadge reality="SIMULATED" /></header>
      <div className="kill-switch__body"><span><AlertOctagon aria-hidden="true" /></span><div><strong>{state.replaceAll("_", " ")}</strong><p>{message}</p><small><ShieldAlert aria-hidden="true" size={11} /> Backend enforcement: {initial.backendEnforcement}</small></div>{!confirming ? <button onClick={request} type="button">Request simulated stop</button> : <div className="kill-switch__confirm"><strong>Confirm simulation-only state change?</strong><button onClick={confirm} type="button"><CheckCircle2 aria-hidden="true" size={12} /> Apply simulated stop</button><button onClick={cancel} type="button"><X aria-hidden="true" size={12} /> Cancel</button></div>}</div>
      <p aria-live="assertive">{initial.disclosure}</p>
    </section>
  );
}
