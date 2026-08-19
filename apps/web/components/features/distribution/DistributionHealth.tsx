import { Activity, DatabaseZap, ShieldAlert } from "lucide-react";
import { Phase3AccountState } from "@/components/features/distribution/Phase3AccountState";
import type { DistributionHealthRecord } from "@/types/phase3-experience";

export function DistributionHealth({ records }: { records: DistributionHealthRecord[] }) {
  return (
    <div className="phase3-stack">
      <section className="health-hero">
        <div><span>HEALTH MODEL</span><h2>Template readiness is not provider health.</h2><p>Local adaptation can be ready while OAuth, account ownership, delivery, and provider telemetry remain unavailable.</p></div>
        <div aria-label="Distribution provider summary"><DatabaseZap aria-hidden="true" /><strong>0 / {records.length}</strong><span>provider health feeds</span></div>
      </section>
      <section className="health-matrix" aria-labelledby="health-matrix-title">
        <header><div><span>ELEVEN-PLATFORM MATRIX</span><h2 id="health-matrix-title">Readiness and recovery</h2></div><Activity aria-hidden="true" /></header>
        <div className="responsive-table">
          <table>
            <thead><tr><th>Platform</th><th>Account</th><th>Template</th><th>Provider health</th><th>Issue and safe action</th></tr></thead>
            <tbody>
              {records.map((item) => (
                <tr key={item.platform}>
                  <th scope="row">{item.platform}</th>
                  <td><Phase3AccountState state={item.accountState} /></td>
                  <td><span className={`readiness readiness--${item.templateReadiness.toLowerCase()}`}>{item.templateReadiness}</span></td>
                  <td><span className="readiness readiness--unavailable"><DatabaseZap aria-hidden="true" size={11} /> UNAVAILABLE</span></td>
                  <td><strong>{item.issue}</strong><small>{item.action}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside className="phase3-notice"><ShieldAlert aria-hidden="true" size={18} /><div><strong>Retry protection</strong><p>A local retry demonstration cannot cross the provider boundary. Authorization, idempotency, delivery receipts, and audit evidence would be required first.</p></div></aside>
    </div>
  );
}
