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
      detail:
        "Synthetic mobile readership data indicates movement in Greater Accra.",
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
  operations: [
    {
      id: "active",
      label: "Agents in running state",
      value: "8",
      detail: "Development runtime",
      tone: "blue",
    },
    {
      id: "workflows",
      label: "Workflows in progress",
      value: "14",
      detail: "Local orchestration fixture",
      tone: "purple",
    },
    {
      id: "queued",
      label: "Items queued",
      value: "23",
      detail: "Across editorial stages",
      tone: "warning",
    },
    {
      id: "review",
      label: "Awaiting human review",
      value: "3",
      detail: "Editorial authority retained",
      tone: "gold",
    },
  ],
  workflow: [
    {
      id: "discover",
      label: "Discover",
      status: "completed",
      count: 42,
      owner: "Discovery agents",
    },
    {
      id: "verify",
      label: "Verify",
      status: "running",
      count: 8,
      owner: "Truth agents",
    },
    {
      id: "analyze",
      label: "Analyze",
      status: "running",
      count: 6,
      owner: "Intelligence",
    },
    {
      id: "create",
      label: "Create",
      status: "queued",
      count: 5,
      owner: "Newsroom",
    },
    {
      id: "review",
      label: "Review",
      status: "review",
      count: 3,
      owner: "Editors",
    },
    {
      id: "distribute",
      label: "Distribute",
      status: "unavailable",
      owner: "Integration required",
    },
    { id: "measure", label: "Measure", status: "waiting", owner: "Analytics" },
    {
      id: "optimize",
      label: "Optimize",
      status: "waiting",
      owner: "AI feedback",
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
