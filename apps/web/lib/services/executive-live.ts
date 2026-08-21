import type { LiveSourceState } from "@/types/executive-command";

export interface LiveControlPayload {
  kill_switch?: string;
  global_level?: number;
  domains?: Array<{ domain?: string; Domain?: string; level?: number; Level?: number; requirement?: string; Requirement?: string }>;
  audit?: Array<{
    id?: string;
    action?: string;
    resource?: string;
    decision?: string;
    reason?: string;
    created_at?: string;
  }>;
  execution_reality?: string;
}

export interface LiveMemoryRow {
  id?: string;
  insight?: string;
  evidence?: string;
  source?: string;
  classification?: string;
  confidence?: string;
  created_at?: string;
  execution_reality?: string;
}

export interface LiveScenarioRow {
  id?: string;
  name?: string;
  kind?: string;
  execution_reality?: string;
}

export interface LiveUsageRow {
  estimated_micros?: number;
  cost_source?: string;
  model?: string;
  task?: string;
}

export interface LiveAccountRow {
  platform?: string;
  provider?: string;
  status?: string;
  connected?: boolean;
}

export interface ExecutiveLiveOverlay {
  session: LiveSourceState;
  authenticated: boolean;
  control: { state: LiveSourceState; data: LiveControlPayload | null };
  cost: { state: LiveSourceState; usage: LiveUsageRow[]; costSource: string };
  memory: { state: LiveSourceState; memories: LiveMemoryRow[] };
  scenarios: { state: LiveSourceState; scenarios: LiveScenarioRow[] };
  accounts: { state: LiveSourceState; accounts: LiveAccountRow[] };
  distributions: { state: LiveSourceState; count: number };
}

const empty: ExecutiveLiveOverlay = {
  session: "NOT_FETCHED",
  authenticated: false,
  control: { state: "NOT_FETCHED", data: null },
  cost: { state: "NOT_FETCHED", usage: [], costSource: "ESTIMATED" },
  memory: { state: "NOT_FETCHED", memories: [] },
  scenarios: { state: "NOT_FETCHED", scenarios: [] },
  accounts: { state: "NOT_FETCHED", accounts: [] },
  distributions: { state: "NOT_FETCHED", count: 0 },
};

async function readJson(path: string, signal?: AbortSignal): Promise<{ status: number; body: unknown }> {
  const response = await fetch(path, { signal, cache: "no-store" });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

function classify(status: number): LiveSourceState {
  if (status === 401 || status === 403) return "UNAUTHENTICATED";
  if (status >= 200 && status < 300) return "LIVE";
  if (status === 404 || status === 503) return "UNAVAILABLE";
  return "ERROR";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export async function fetchExecutiveLive(signal?: AbortSignal): Promise<ExecutiveLiveOverlay> {
  if (typeof window === "undefined") return empty;
  const overlay: ExecutiveLiveOverlay = {
    ...empty,
    session: "UNAVAILABLE",
    control: { state: "UNAVAILABLE", data: null },
    cost: { state: "UNAVAILABLE", usage: [], costSource: "ESTIMATED" },
    memory: { state: "UNAVAILABLE", memories: [] },
    scenarios: { state: "UNAVAILABLE", scenarios: [] },
    accounts: { state: "UNAVAILABLE", accounts: [] },
    distributions: { state: "UNAVAILABLE", count: 0 },
  };
  try {
    const [session, control, cost, memory, scenarios, accounts, distributions] = await Promise.all([
      readJson("/api/v1/auth/session", signal),
      readJson("/api/v1/autonomy/control", signal),
      readJson("/api/v1/autonomy/cost", signal),
      readJson("/api/v1/autonomy/memory", signal),
      readJson("/api/v1/autonomy/scenarios", signal),
      readJson("/api/v1/social/accounts", signal),
      readJson("/api/v1/distribution/list", signal),
    ]);
    overlay.session = classify(session.status);
    overlay.authenticated = overlay.session === "LIVE";
    overlay.control = {
      state: classify(control.status),
      data: overlay.session === "LIVE" && classify(control.status) === "LIVE" ? (asRecord(control.body) as LiveControlPayload) : null,
    };
    const costBody = asRecord(cost.body);
    overlay.cost = {
      state: classify(cost.status),
      usage: Array.isArray(costBody?.usage) ? (costBody.usage as LiveUsageRow[]) : [],
      costSource: typeof costBody?.cost_source === "string" ? costBody.cost_source : "ESTIMATED",
    };
    const memoryBody = asRecord(memory.body);
    overlay.memory = {
      state: classify(memory.status),
      memories: Array.isArray(memoryBody?.memories) ? (memoryBody.memories as LiveMemoryRow[]) : [],
    };
    const scenarioBody = asRecord(scenarios.body);
    overlay.scenarios = {
      state: classify(scenarios.status),
      scenarios: Array.isArray(scenarioBody?.scenarios) ? (scenarioBody.scenarios as LiveScenarioRow[]) : [],
    };
    const accountBody = asRecord(accounts.body);
    overlay.accounts = {
      state: classify(accounts.status),
      accounts: Array.isArray(accountBody?.accounts) ? (accountBody.accounts as LiveAccountRow[]) : [],
    };
    const distBody = asRecord(distributions.body);
    const distList = Array.isArray(distBody?.distributions)
      ? distBody.distributions
      : Array.isArray(distBody?.jobs)
        ? distBody.jobs
        : [];
    overlay.distributions = {
      state: classify(distributions.status),
      count: distList.length,
    };
  } catch {
    /* keep UNAVAILABLE — never invent live success */
  }
  return overlay;
}
