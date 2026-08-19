"use client";

import {
  CalendarClock,
  DatabaseZap,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { DataAuthorityBadge } from "@/components/features/business/DataAuthorityBadge";
import { useAuth } from "@/hooks/useAuth";

export function ProfileWorkspace() {
  const { session } = useAuth();
  const displayName = session?.user.name ?? "Demo user";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="settings-page profile-page">
      <header className="settings-header">
        <div>
          <span className="settings-header__eyebrow">
            <UserRound size={14} /> Identity presentation
          </span>
          <h1>Profile</h1>
          <p>
            Review the identity currently held by the browser-local demo
            session. This role display is not an authorization boundary.
          </p>
        </div>
        <DataAuthorityBadge state="demo" />
      </header>

      <div className="profile-layout">
        <aside className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <h2>{displayName}</h2>
          <p>{session?.user.email ?? "No demo email available"}</p>
          <span>{session?.user.role ?? "user"} · frontend demo</span>
          <Link className="settings-link" href="/settings">Workspace settings</Link>
        </aside>

        <section className="profile-details">
          <div className="settings-panel__heading">
            <span><UserRound size={18} /></span>
            <div>
              <h2>Current session identity</h2>
              <p>Read-only values from browser session storage.</p>
            </div>
          </div>
          <dl className="profile-detail-list">
            <div>
              <dt><UserRound size={15} /> Display name</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt><Mail size={15} /> Email</dt>
              <dd>{session?.user.email ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt><ShieldCheck size={15} /> Presented role</dt>
              <dd>{session?.user.role ?? "user"} · UX only</dd>
            </div>
            <div>
              <dt><CalendarClock size={15} /> Demo session expiry</dt>
              <dd>
                {session?.expiresAt
                  ? new Intl.DateTimeFormat("en-GH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Accra",
                    }).format(new Date(session.expiresAt))
                  : "Unavailable"}
              </dd>
            </div>
          </dl>
          <div className="profile-integration-state" role="note">
            <DatabaseZap size={18} />
            <div>
              <strong>Profile editing requires integration</strong>
              <p>
                No backend account, identity update endpoint, or authoritative
                role service is connected. No changes can be submitted here.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
