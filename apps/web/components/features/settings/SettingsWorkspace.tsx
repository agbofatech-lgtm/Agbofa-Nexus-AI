"use client";

import {
  Bell,
  DatabaseZap,
  Globe2,
  MonitorCog,
  Palette,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { ControlPlaneDirectory } from "@/components/features/settings/ControlPlaneDirectory";
import { DataAuthorityBadge } from "@/components/features/business/DataAuthorityBadge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const integrationRows = [
  {
    label: "Email notifications",
    description: "Requires a notification delivery integration.",
  },
  {
    label: "Editorial alerts",
    description: "Requires an authoritative event stream.",
  },
  {
    label: "Weekly intelligence digest",
    description: "Requires backend scheduling and delivery.",
  },
] as const;

export function SettingsWorkspace() {
  const { session } = useAuth();

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-header__eyebrow">
            <MonitorCog size={14} /> Workspace presentation
          </span>
          <h1>Settings</h1>
          <p>
            Control frontend presentation and inspect integration boundaries.
            Security-critical settings remain outside this frontend scope.
          </p>
        </div>
        <DataAuthorityBadge state="demo" />
      </header>

      <aside className="settings-boundary" role="note">
        <DatabaseZap size={19} />
        <div>
          <strong>Frontend settings only</strong>
          <p>
            Changes shown here do not configure backend authentication,
            authorization, providers, publishing, or tenant isolation.
          </p>
        </div>
      </aside>

      <ControlPlaneDirectory />
      <div className="settings-layout">
        <section className="settings-panel settings-panel--primary">
          <div className="settings-panel__heading">
            <span>
              <Palette size={18} />
            </span>
            <div>
              <h2>Appearance</h2>
              <p>Choose the presentation theme for this browser.</p>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <strong>Color theme</strong>
              <span>Stored locally in this browser.</span>
            </div>
            <ThemeToggle />
          </div>
          <div className="settings-row">
            <div>
              <strong>Reduced motion</strong>
              <span>
                Automatically follows your operating-system preference.
              </span>
            </div>
            <span className="settings-state">System controlled</span>
          </div>
          <div className="settings-row">
            <div>
              <strong>Interface density</strong>
              <span>
                Comfortable spacing supports editorial and operational work.
              </span>
            </div>
            <span className="settings-state">Comfortable</span>
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel__heading">
            <span>
              <Globe2 size={18} />
            </span>
            <div>
              <h2>Region &amp; language</h2>
              <p>Current frontend presentation defaults.</p>
            </div>
          </div>
          <dl className="settings-definition-list">
            <div>
              <dt>Language</dt>
              <dd>English</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>Ghana</dd>
            </div>
            <div>
              <dt>Time zone</dt>
              <dd>Africa/Accra · GMT</dd>
            </div>
          </dl>
          <span className="settings-integration-note">
            Locale switching: integration required
          </span>
        </section>

        <section className="settings-panel settings-panel--wide">
          <div className="settings-panel__heading">
            <span>
              <Bell size={18} />
            </span>
            <div>
              <h2>Notifications</h2>
              <p>
                Delivery controls remain visibly unavailable until connected.
              </p>
            </div>
          </div>
          <div className="settings-integration-list">
            {integrationRows.map((row) => (
              <div key={row.label} className="settings-row">
                <div>
                  <strong>{row.label}</strong>
                  <span>{row.description}</span>
                </div>
                <button disabled type="button">
                  Not connected
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-panel__heading">
            <span>
              <UserRound size={18} />
            </span>
            <div>
              <h2>Demo identity</h2>
              <p>Browser-local session presentation.</p>
            </div>
          </div>
          <dl className="settings-definition-list">
            <div>
              <dt>Name</dt>
              <dd>{session?.user.name ?? "Demo user"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{session?.user.role ?? "user"} · UX only</dd>
            </div>
            <div>
              <dt>Tenant</dt>
              <dd>{session?.tenant ?? "Demo tenant"}</dd>
            </div>
          </dl>
          <Link className="settings-link" href="/profile">
            Open profile presentation
          </Link>
        </section>

        <section className="settings-panel">
          <div className="settings-panel__heading">
            <span>
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2>Security integration</h2>
              <p>
                Authoritative controls are not implemented by this frontend.
              </p>
            </div>
          </div>
          <ul className="settings-security-list">
            <li>
              <span>Frontend AuthGuard</span>
              <b>Demo UX</b>
            </li>
            <li>
              <span>Server authentication</span>
              <b>Not connected</b>
            </li>
            <li>
              <span>Backend RBAC</span>
              <b>Not connected</b>
            </li>
            <li>
              <span>Tenant enforcement</span>
              <b>Not connected</b>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
