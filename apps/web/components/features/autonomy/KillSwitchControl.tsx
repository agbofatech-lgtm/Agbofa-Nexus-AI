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
    addAudit(
      "APPLY_SIMULATED_STOP",
      state,
      "SIMULATED_STOP_APPLIED",
      "User confirmed a local display-state change with no backend effect.",
    );
    setState("SIMULATED_STOP_APPLIED");
    setConfirming(false);
    setMessage("Simulated stop applied to local presentation state. No agents, jobs, providers, publishing, or spending were interrupted.");
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
