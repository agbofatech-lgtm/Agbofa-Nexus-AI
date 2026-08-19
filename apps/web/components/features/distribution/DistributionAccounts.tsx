"use client";

import { KeyRound, Shield, UserRound } from "lucide-react";
import { useState } from "react";
import { Phase3AccountState } from "@/components/features/distribution/Phase3AccountState";
import type { AccountScope, DistributionAccount } from "@/types/phase3-experience";

function AccountGroup({
  accounts,
  scope,
  onPlan,
}: {
  accounts: DistributionAccount[];
  scope: AccountScope;
  onPlan: (account: DistributionAccount) => void;
}) {
  const Icon = scope === "BRAND" ? Shield : UserRound;
  return (
    <section className={`account-directory account-directory--${scope.toLowerCase()}`}>
      <header>
        <span><Icon aria-hidden="true" size={16} /> {scope} ACCOUNTS</span>
        <strong>{accounts.length} records</strong>
      </header>
      <p>
        {scope === "BRAND"
          ? "Organization destinations require verified ownership and future authorization."
          : "Owner identities are never presented as brand connections; manual control stays with the person."}
      </p>
      <div>
        {accounts.map((item) => (
          <article key={item.id}>
            <div className="account-directory__identity">
              <span aria-hidden="true">{item.platform.slice(0, 2).toUpperCase()}</span>
              <div><strong>{item.label}</strong><small>{item.handle ?? "No verified handle"}</small></div>
            </div>
            <Phase3AccountState state={item.state} />
            <p>{item.stateDetail}</p>
            <footer>
              <span>{item.connectionReality.replaceAll("_", " ")}</span>
              <button onClick={() => onPlan(item)} type="button">
                <KeyRound aria-hidden="true" size={12} />
                {item.state === "MANUAL" ? "View handoff" : "Plan next step"}
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DistributionAccounts({ accounts }: { accounts: DistributionAccount[] }) {
  const [message, setMessage] = useState(
    "No connect control in this directory performs OAuth or provider authorization.",
  );
  const plan = (item: DistributionAccount) =>
    setMessage(`${item.platform}: ${item.nextStep} This is guidance only; no external action was taken.`);
  return (
    <div className="phase3-stack">
      <aside className="phase3-notice phase3-notice--gold" aria-live="polite">
        <KeyRound aria-hidden="true" size={18} />
        <div><strong>Connection boundary</strong><p>{message}</p></div>
      </aside>
      <div className="account-groups">
        <AccountGroup accounts={accounts.filter((item) => item.scope === "BRAND")} onPlan={plan} scope="BRAND" />
        <AccountGroup accounts={accounts.filter((item) => item.scope === "PERSONAL")} onPlan={plan} scope="PERSONAL" />
      </div>
      <section className="state-legend" aria-label="Supported account states">
        <h2>Account state language</h2>
        <div>{(["CONNECTED", "PENDING", "DEGRADED", "NOT_CREATED", "MANUAL", "REQUIRES_AUTHORIZATION"] as const).map((state) => <Phase3AccountState key={state} state={state} />)}</div>
        <p>CONNECTED is supported by the contract but intentionally unused because this repository contains no verified provider connection.</p>
      </section>
    </div>
  );
}
