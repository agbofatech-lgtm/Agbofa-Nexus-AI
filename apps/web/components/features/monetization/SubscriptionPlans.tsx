import { Check } from "lucide-react";
import type { MonetizationData } from "@/types/business";
export function SubscriptionPlans({
  plans,
}: {
  plans: MonetizationData["plans"];
}) {
  return (
    <section className="subscription-plans">
      <div className="business-section-heading">
        <div>
          <span>DEMO CONFIGURATION</span>
          <h2>Subscription plans</h2>
        </div>
        <p>No billing or entitlement system is modified.</p>
      </div>
      <div>
        {plans.map((plan) => (
          <article key={plan.id} className="plan-card glass-card">
            <span>{plan.status}</span>
            <h3>{plan.name}</h3>
            <strong>
              ${plan.price}
              <small>/{plan.interval}</small>
            </strong>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>
                  <Check size={12} />
                  {f}
                </li>
              ))}
            </ul>
            <footer>
              <b>{plan.subscribers.toLocaleString()}</b> demo subscribers ·{" "}
              {plan.conversion}% demo conversion
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
