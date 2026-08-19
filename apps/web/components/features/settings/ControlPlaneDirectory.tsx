import {
  BarChart3,
  Bell,
  Bot,
  Code2,
  CreditCard,
  DatabaseZap,
  PlugZap,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
type State = "available" | "development" | "local" | "unavailable";
interface Item {
  label: string;
  detail: string;
  status: State;
  href?: string;
}
interface Group {
  id: string;
  label: string;
  icon: LucideIcon;
  items: readonly Item[];
}
const groups: readonly Group[] = [
  {
    id: "account",
    label: "Account",
    icon: UserRound,
    items: [
      {
        label: "Profile",
        detail: "Read-only browser identity",
        status: "local",
        href: "/profile",
      },
      {
        label: "Preferences",
        detail: "Reader preferences",
        status: "local",
        href: "/reader",
      },
      {
        label: "Appearance",
        detail: "Theme stored in this browser",
        status: "available",
        href: "/settings",
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: Bot,
    items: [
      {
        label: "Providers",
        detail: "Catalog only; credentials absent",
        status: "unavailable",
        href: "/ai-control",
      },
      {
        label: "Models",
        detail: "Development model catalog",
        status: "development",
        href: "/ai-control",
      },
      {
        label: "Confidence",
        detail: "Evidence and prediction models",
        status: "development",
        href: "/predictive",
      },
      {
        label: "Behavior",
        detail: "Backend policy required",
        status: "unavailable",
      },
    ],
  },
  {
    id: "distribution",
    label: "Distribution",
    icon: Send,
    items: [
      {
        label: "Channels",
        detail: "16 represented; no OAuth",
        status: "unavailable",
        href: "/distribution",
      },
      {
        label: "Templates",
        detail: "Local platform adaptation",
        status: "available",
        href: "/distribution",
      },
      {
        label: "Scheduling",
        detail: "Frontend planning only",
        status: "local",
        href: "/distribution",
      },
      {
        label: "Automation",
        detail: "Publishing integration required",
        status: "unavailable",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      {
        label: "Measurement",
        detail: "Development analytics workspace",
        status: "development",
        href: "/analytics",
      },
      {
        label: "Data sources",
        detail: "Live analytics adapter unavailable",
        status: "unavailable",
      },
      {
        label: "Exports",
        detail: "Export integration required",
        status: "unavailable",
      },
    ],
  },
  {
    id: "data-privacy",
    label: "Data & Privacy",
    icon: DatabaseZap,
    items: [
      {
        label: "Provenance",
        detail: "Contextual source disclosure enabled",
        status: "available",
      },
      {
        label: "Data retention",
        detail: "Backend policy required",
        status: "unavailable",
      },
      {
        label: "Consent",
        detail: "Consent service unavailable",
        status: "unavailable",
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    items: [
      {
        label: "Email",
        detail: "Delivery integration required",
        status: "unavailable",
      },
      { label: "Push", detail: "Push service required", status: "unavailable" },
      {
        label: "In-app",
        detail: "Development activity",
        status: "development",
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    items: [
      {
        label: "Authentication",
        detail: "Frontend demo UX only",
        status: "development",
      },
      {
        label: "Sessions",
        detail: "Browser-local presentation",
        status: "local",
      },
      { label: "API keys", detail: "Not exposed", status: "unavailable" },
      {
        label: "Security events",
        detail: "Event stream required",
        status: "unavailable",
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    items: [
      {
        label: "Members",
        detail: "Development users",
        status: "development",
        href: "/admin/users",
      },
      {
        label: "Roles",
        detail: "UX labels; not backend RBAC",
        status: "development",
        href: "/admin",
      },
      {
        label: "Permissions",
        detail: "Backend authorization required",
        status: "unavailable",
      },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: PlugZap,
    items: [
      {
        label: "Social",
        detail: "No OAuth accounts",
        status: "unavailable",
        href: "/distribution",
      },
      { label: "APIs", detail: "No frontend contract", status: "unavailable" },
      {
        label: "Webhooks",
        detail: "No webhook contract",
        status: "unavailable",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    items: [
      {
        label: "Plan",
        detail: "Development subscription model",
        status: "development",
        href: "/monetization",
      },
      {
        label: "Payment",
        detail: "Billing provider required",
        status: "unavailable",
      },
      {
        label: "Invoices",
        detail: "Billing provider required",
        status: "unavailable",
      },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    icon: Code2,
    items: [
      { label: "API", detail: "No supported endpoint", status: "unavailable" },
      {
        label: "Webhooks",
        detail: "No supported endpoint",
        status: "unavailable",
      },
      {
        label: "Logs",
        detail: "Logging backend required",
        status: "unavailable",
      },
    ],
  },
];
const labels = {
  available: "Available",
  development: "Development",
  local: "Browser local",
  unavailable: "Not connected",
} as const;
export function ControlPlaneDirectory() {
  return (
    <section
      className="settings-control-plane"
      aria-labelledby="control-plane-title"
    >
      <header>
        <div>
          <span>Capability-aware control plane</span>
          <h2 id="control-plane-title">
            Configure what exists. See what requires integration.
          </h2>
        </div>
        <p>No unavailable control silently reports success.</p>
      </header>
      <div className="settings-control-plane__grid">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <article key={g.id} className="control-plane-group">
              <div className="control-plane-group__heading">
                <span>
                  <Icon aria-hidden="true" size={17} />
                </span>
                <h3>{g.label}</h3>
              </div>
              <ul>
                {g.items.map((i) => {
                  const c = (
                    <>
                      <span>
                        <strong>{i.label}</strong>
                        <small>{i.detail}</small>
                      </span>
                      <b
                        className={`control-plane-state control-plane-state--${i.status}`}
                      >
                        {labels[i.status]}
                      </b>
                    </>
                  );
                  return (
                    <li key={i.label}>
                      {i.href ? <Link href={i.href}>{c}</Link> : <div>{c}</div>}
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
