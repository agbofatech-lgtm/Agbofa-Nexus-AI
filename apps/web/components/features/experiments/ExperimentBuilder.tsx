"use client";

import { FlaskConical, Save, ShieldAlert } from "lucide-react";
import { type FormEvent, useState } from "react";

export function ExperimentBuilder() {
  const [message, setMessage] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Draft validated in local component state. No experiment was created, no audience was enrolled, and no event was sent.");
  };
  return (
    <div className="phase3-stack">
      <aside className="phase3-notice phase3-notice--gold"><ShieldAlert aria-hidden="true" size={18} /><div><strong>Simulated creation only</strong><p>This form demonstrates the contract. It has no API, mutation, assignment engine, user enrollment, or persistence.</p></div></aside>
      <form className="experiment-builder" onSubmit={submit}>
        <header><div><span>LOCAL SPECIFICATION</span><h2>Frame a falsifiable experiment</h2></div><FlaskConical aria-hidden="true" /></header>
        <div className="experiment-builder__grid">
          <label>Experiment name<input defaultValue="Evidence-first headline" maxLength={80} name="name" required /></label>
          <label>Owner<input defaultValue="Growth editor" maxLength={80} name="owner" required /></label>
          <label className="experiment-builder__wide">Hypothesis<textarea defaultValue="If evidence context appears in the headline, qualified registration intent may improve without reducing comprehension." maxLength={400} name="hypothesis" required /></label>
          <label>Control treatment<input defaultValue="Standard explanatory headline" maxLength={160} name="control" required /></label>
          <label>Variant treatment<input defaultValue="Evidence-first headline with confidence context" maxLength={160} name="variant" required /></label>
          <label>Audience<input defaultValue="Synthetic evidence-seeking readers" maxLength={160} name="audience" required /></label>
          <label>Success metric<input defaultValue="Simulated qualified registration rate" maxLength={160} name="metric" required /></label>
          <label>Allocation<select defaultValue="50"><option value="50">50 / 50</option><option value="60">60 / 40</option><option value="70">70 / 30</option></select></label>
          <label>State<select defaultValue="DRAFT"><option>DRAFT</option><option>PAUSED</option></select></label>
        </div>
        <fieldset><legend>Integrity checklist</legend><label><input required type="checkbox" /> Outcome is explicitly simulated</label><label><input required type="checkbox" /> No causal claim without significance and design evidence</label><label><input required type="checkbox" /> No real audience enrollment or execution</label></fieldset>
        <footer><button type="submit"><Save aria-hidden="true" size={13} /> Validate simulated draft</button><span aria-live="polite">{message || "Complete the integrity checklist to validate locally."}</span></footer>
      </form>
    </div>
  );
}
