import { demoDataState } from "@/types/data-state";
import type { CommandOverviewData } from "@/types/command";

const commandOverview: CommandOverviewData = {
  dataAuthority: "DEMO",
  generatedAt: null,
  metrics: [
    {
      id: "agents",
      label: "Registered agent definitions",
      value: "28",
      context: "Canonical frontend registry",
      tone: "gold",
    },
    {
      id: "stories",
      label: "Stories in demo corpus",
      value: "50",
      context: "Deterministic local fixtures",
      tone: "blue",
    },
    {
      id: "confidence",
      label: "Example confidence",
      value: "94.8%",
      context: "Illustrative, not measured",
      tone: "green",
    },
    {
      id: "reach",
      label: "Example audience reach",
      value: "2.4M",
      context: "Synthetic analytics fixture",
      tone: "purple",
    },
  ],
  activity: [
    {
      id: "verified",
      title: "Example market signal verified",
      detail: "Demo Truth Engine fixture references 14 illustrative sources.",
      timeLabel: "Demo sequence 01",
      tone: "green",
    },
    {
      id: "agent",
      title: "Example newsroom task prepared",
      detail: "A simulated specialist is assigned to a regional impact brief.",
      timeLabel: "Demo sequence 02",
      tone: "gold",
    },
    {
      id: "audience",
      title: "Example audience pattern detected",
      detail: "Synthetic mobile readership data indicates movement in Greater Accra.",
      timeLabel: "Demo sequence 03",
      tone: "blue",
    },
  ],
  signals: [
    {
      label: "Monetary policy brief",
      status: "verified-demo",
      value: "Verified fixture",
    },
    {
      label: "Climate resilience report",
      status: "confidence-demo",
      value: "88% example",
    },
    {
      label: "West Africa markets desk",
      status: "queued-demo",
      value: "Demo queue",
    },
  ],
  network: {
    registeredAgents: 28,
    simulatedConnectedAgents: 12,
    exampleEventsPerMinute: 847,
    exampleConfidence: 96,
  },
};

export const demoCommandOverview = demoDataState(
  commandOverview,
  "Local Phase 1 command overview fixture",
);
