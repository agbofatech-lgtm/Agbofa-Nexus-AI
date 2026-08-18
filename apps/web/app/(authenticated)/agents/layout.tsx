import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/agents.css";

export const metadata: Metadata = {
  title: "Agent Workforce",
  description:
    "Canonical AI agent registry, simulated telemetry, and workforce operations console.",
  robots: { index: false, follow: false },
};

export default function AgentsLayout({ children }: { children: ReactNode }) {
  return <div className="agents-route">{children}</div>;
}
