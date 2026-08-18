import registry from "../../../../docs/indexes/json/agents.json";

import type {
  Agent,
  AgentCategory,
  AgentExecution,
  AgentStatus,
  AgentTelemetryPoint,
} from "@/types/agents";

interface RegistryAgent {
  id: string;
  name: string;
  role: string;
  status: string;
  source_reference: string;
  implementation_status: string;
}

const referenceTime = Date.parse("2026-08-17T14:00:00Z");
const statusPattern: AgentStatus[] = [
  "running",
  "idle",
  "queued",
  "running",
  "degraded",
  "running",
  "failed",
  "disabled",
  "running",
  "idle",
  "queued",
  "running",
];

function categoryFromRole(role: string): AgentCategory {
  const normalized = role.toLowerCase();
  if (
    normalized === "content" ||
    normalized === "verification" ||
    normalized === "distribution" ||
    normalized === "analytics" ||
    normalized === "monetisation" ||
    normalized === "platform"
  ) {
    return normalized;
  }
  return "platform";
}

function metricForStatus(
  status: AgentStatus,
  index: number,
): Pick<Agent, "health" | "queue" | "throughput" | "latency" | "successRate"> {
  const jitter = (index * 17) % 9;
  switch (status) {
    case "running":
      return {
        health: 96.1 + jitter * 0.4,
        queue: 4 + ((index * 7) % 25),
        throughput: 38 + ((index * 83) % 1_180),
        latency: 88 + ((index * 29) % 170),
        successRate: 96.4 + (jitter % 6) * 0.45,
      };
    case "idle":
      return {
        health: 94.2 + jitter * 0.3,
        queue: 0,
        throughput: 0,
        latency: 74 + ((index * 13) % 60),
        successRate: 95.2 + (jitter % 5) * 0.5,
      };
    case "queued":
      return {
        health: 90.8 + jitter * 0.35,
        queue: 31 + ((index * 11) % 68),
        throughput: 8 + ((index * 19) % 42),
        latency: 210 + ((index * 31) % 260),
        successRate: 92.1 + (jitter % 5) * 0.6,
      };
    case "degraded":
      return {
        health: 80.5 + jitter * 0.55,
        queue: 68 + ((index * 13) % 92),
        throughput: 12 + ((index * 17) % 80),
        latency: 420 + ((index * 37) % 390),
        successRate: 82.8 + (jitter % 6) * 0.8,
      };
    case "failed":
      return {
        health: 58 + jitter * 1.2,
        queue: 114 + ((index * 9) % 80),
        throughput: 0,
        latency: 1_100 + ((index * 47) % 700),
        successRate: 63 + (jitter % 5) * 2.1,
      };
    case "disabled":
      return {
        health: 0,
        queue: 0,
        throughput: 0,
        latency: 0,
        successRate: 0,
      };
  }
}

function taskFor(
  agent: RegistryAgent,
  category: AgentCategory,
  status: AgentStatus,
  index: number,
) {
  if (!["running", "queued", "degraded"].includes(status)) return undefined;
  return {
    id: `task-${agent.id.toLowerCase()}-${index + 1}`,
    title: `Simulated ${category} workflow evaluation`,
    progress: status === "queued" ? 0 : 24 + ((index * 13) % 70),
    startedAt: new Date(referenceTime - (index + 2) * 43_000),
    estimatedDurationSeconds: 210 + ((index * 37) % 480),
    simulated: true as const,
  };
}

function executionsFor(agent: RegistryAgent, index: number): AgentExecution[] {
  return Array.from({ length: 10 }, (_, executionIndex) => {
    const status =
      (executionIndex + index) % 11 === 0
        ? "failure"
        : (executionIndex + index) % 5 === 0
          ? "warning"
          : "success";
    return {
      id: `${agent.id}-execution-${executionIndex + 1}`,
      startedAt: new Date(
        referenceTime - (index * 4 + executionIndex + 1) * 6 * 60_000,
      ),
      durationMs:
        status === "failure"
          ? 1_240 + index * 19
          : status === "warning"
            ? 380 + index * 11
            : 92 + ((index * 23 + executionIndex * 17) % 210),
      status,
      summary:
        status === "failure"
          ? "Simulated execution stopped after a recoverable dependency error."
          : status === "warning"
            ? "Simulated execution completed with a rate or confidence warning."
            : `Simulated ${agent.role.toLowerCase()} workflow completed.`,
      simulated: true,
    };
  });
}

function telemetrySeries(
  base: number,
  index: number,
  variance: number,
  floor = 0,
  ceiling = Number.POSITIVE_INFINITY,
): AgentTelemetryPoint[] {
  return Array.from({ length: 20 }, (_, pointIndex) => ({
    at: new Date(referenceTime - (19 - pointIndex) * 5 * 60_000),
    value: Number(
      Math.min(
        ceiling,
        Math.max(
          floor,
          base +
            Math.sin((pointIndex + index) / 2.4) * variance +
            (((pointIndex * 7 + index * 3) % 9) - 4) * (variance / 9),
        ),
      ).toFixed(2),
    ),
  }));
}

const canonicalAgents = registry.items as RegistryAgent[];
const categoryMembers = canonicalAgents.reduce<Record<string, string[]>>(
  (groups, item) => {
    const category = categoryFromRole(item.role);
    groups[category] = [...(groups[category] ?? []), item.id];
    return groups;
  },
  {},
);

export const mockAgents: Agent[] = canonicalAgents.map((agent, index) => {
  const category = categoryFromRole(agent.role);
  const status = statusPattern[index % statusPattern.length] ?? "idle";
  const metrics = metricForStatus(status, index);
  const executions = executionsFor(agent, index);
  const members = categoryMembers[category] ?? [];
  const categoryIndex = members.indexOf(agent.id);

  return {
    id: agent.id,
    name: agent.name,
    category,
    description: `${agent.name} is canonically registered in the ${agent.role} domain. Detailed capabilities, tools, inputs, outputs, and memory scope remain pending extraction in the repository registry.`,
    status,
    health: Number(metrics.health.toFixed(1)),
    queue: metrics.queue,
    throughput: metrics.throughput,
    latency: metrics.latency,
    successRate: Number(metrics.successRate.toFixed(1)),
    currentTask: taskFor(agent, category, status, index),
    lastExecution: executions[0],
    executions,
    dependencies: {
      input: categoryIndex > 0 ? [members[categoryIndex - 1] ?? ""] : [],
      output:
        categoryIndex >= 0 && categoryIndex < members.length - 1
          ? [members[categoryIndex + 1] ?? ""]
          : [],
      provenance: "simulated",
    },
    telemetry: {
      throughput: telemetrySeries(
        metrics.throughput,
        index,
        Math.max(3, metrics.throughput * 0.12),
      ),
      latency: telemetrySeries(
        metrics.latency,
        index + 2,
        Math.max(8, metrics.latency * 0.14),
      ),
      successRate: telemetrySeries(metrics.successRate, index + 4, 1.3, 0, 100),
      queue: telemetrySeries(
        metrics.queue,
        index + 6,
        Math.max(2, metrics.queue * 0.2),
        0,
      ),
      mode: "simulated",
    },
    implementationStatus:
      agent.implementation_status.toLowerCase() === "completed"
        ? "completed"
        : agent.implementation_status.toLowerCase() === "in progress"
          ? "in_progress"
          : "not_started",
    registryStatus: agent.status,
    sourceReference: agent.source_reference,
  };
});
