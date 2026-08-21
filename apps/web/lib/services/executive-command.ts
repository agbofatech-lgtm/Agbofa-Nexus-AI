import { adaptExecutiveCommand } from "@/lib/adapters/executive-command";
import { mockStories } from "@/lib/mocks/stories";
import { fetchExecutiveLive, type ExecutiveLiveOverlay } from "@/lib/services/executive-live";
import { growthIntelligenceService } from "@/lib/services/growth-intelligence";
import { phase1FoundationService } from "@/lib/services/phase1-foundation";
import { phase3ExperienceService } from "@/lib/services/phase3-experience";
import { phase5ExperienceService } from "@/lib/services/phase5-experience";
import { strategyDirectorService } from "@/lib/services/strategy-director";
import { createDataProvenance, type DataState } from "@/types/data-state";
import type {
  ExecutiveActivityEvent,
  ExecutiveCommandData,
  ExecutiveSearchRecord,
} from "@/types/executive-command";

const foundation = phase1FoundationService.snapshot().data;
const growth = growthIntelligenceService.snapshot().data;
const phase3 = phase3ExperienceService.snapshot().data;
const strategy = strategyDirectorService.snapshot().data;
const phase5 = phase5ExperienceService.snapshot().data;
if (!foundation || !growth || !phase3 || !strategy || !phase5)
  throw new Error("Certified Phase 1–5 snapshots are required for Phase 6.");

const validatedExecutiveWorkspace = adaptExecutiveCommand({
  foundation,
  growth,
  phase3,
  strategy,
  phase5,
  stories: mockStories,
});

const liveProvenance = createDataProvenance(
  "live",
  "Authenticated BFF overlay",
  "Read-only BFF responses. Never converted from simulation into actual execution.",
);

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException("Aborted", "AbortError"));
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function searchIndex(query: string, limit = 8): ExecutiveSearchRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return [...(validatedExecutiveWorkspace.data?.searchIndex ?? [])]
    .map((item) => {
      const label = item.label.toLowerCase();
      const haystack = `${item.label} ${item.description} ${item.domain} ${item.keywords.join(" ")} ${item.sourceId}`.toLowerCase();
      const score = label === normalized ? 4 : label.startsWith(normalized) ? 3 : item.keywords.some((keyword) => keyword.toLowerCase().startsWith(normalized)) ? 2 : haystack.includes(normalized) ? 1 : 0;
      return { item, score };
    })
    .filter((result) => result.score > 0)
    .sort((first, second) => second.score - first.score || first.item.label.localeCompare(second.item.label))
    .slice(0, limit)
    .map((result) => result.item);
}

function youtubeConnected(overlay: ExecutiveLiveOverlay): boolean {
  return overlay.accounts.accounts.some((account) => {
    const platform = `${account.platform ?? account.provider ?? ""}`.toLowerCase();
    const connected = account.connected === true || `${account.status ?? ""}`.toUpperCase().includes("CONNECT");
    return platform.includes("youtube") && connected;
  });
}

export function applyExecutiveLiveOverlay(
  base: ExecutiveCommandData,
  overlay: ExecutiveLiveOverlay,
): ExecutiveCommandData {
  const next: ExecutiveCommandData = structuredClone(base);
  next.liveSources = {
    session: overlay.session,
    autonomyControl: overlay.control.state,
    cost: overlay.cost.state,
    memory: overlay.memory.state,
    scenarios: overlay.scenarios.state,
    accounts: overlay.accounts.state,
    distributions: overlay.distributions.state,
  };

  const kill = overlay.control.data?.kill_switch;
  if (overlay.control.state === "LIVE" && typeof kill === "string") {
    const engaged = kill.toUpperCase() === "ENGAGED";
    next.governance.killSwitch = {
      state: kill.toUpperCase(),
      source: "LIVE",
      blocksPublishingSchedule: engaged,
      executionReality: "ACTUAL",
      note: engaged
        ? "Kill-switch ENGAGED is persisted. Phase 04 schedule remains blocked. This dashboard cannot bypass it."
        : "Kill-switch ARMED is persisted. It does not itself publish or spend.",
    };
    const autonomyHealth = next.capabilities.find((item) => item.id === "health-autonomy");
    if (autonomyHealth) {
      autonomyHealth.capability = "AVAILABLE";
      autonomyHealth.telemetryReality = "ACTUAL";
      autonomyHealth.executionReality = "ACTUAL";
      autonomyHealth.detail = `Backend autonomy control responded. Kill-switch ${kill.toUpperCase()}. Display still cannot grant autonomy.`;
    }
    const publishingHealth = next.capabilities.find((item) => item.id === "health-publishing");
    if (publishingHealth && engaged) {
      publishingHealth.capability = "UNAVAILABLE";
      publishingHealth.detail = "Kill-switch ENGAGED blocks Phase 04 schedule. Command Center has no bypass.";
      publishingHealth.executionReality = "ACTUAL";
    }
    const execute = next.loop.find((item) => item.id === "EXECUTE");
    if (execute && engaged) {
      execute.capabilityState = "UNAVAILABLE";
      execute.executionReality = "ACTUAL";
      execute.description = "Kill-switch ENGAGED. Execute/schedule pathways governed by that control remain blocked.";
    }
  }

  if (overlay.control.state === "LIVE" && overlay.control.data) {
    const level = overlay.control.data.global_level;
    next.governance.autonomy.globalLevel = typeof level === "number" ? level : next.governance.autonomy.globalLevel;
    next.governance.autonomy.source = "LIVE";
    const domains = overlay.control.data.domains ?? [];
    if (domains.length) {
      next.governance.autonomy.domains = domains.map((domain) => ({
        id: String(domain.domain ?? domain.Domain ?? "UNKNOWN"),
        label: String(domain.domain ?? domain.Domain ?? "UNKNOWN"),
        level: Number(domain.level ?? domain.Level ?? 0),
        approvalRequirement: String(domain.requirement ?? domain.Requirement ?? "RISK_BASED"),
        source: "LIVE" as const,
        executionReality: "ACTUAL" as const,
      }));
    }
    const audit = overlay.control.data.audit ?? [];
    const liveEvents: ExecutiveActivityEvent[] = audit.slice(0, 8).map((item) => ({
      id: String(item.id ?? `audit-${item.action}-${item.created_at}`),
      timestamp: String(item.created_at ?? new Date().toISOString()),
      domain: "Autonomy",
      title: String(item.action ?? "AUTONOMY_EVENT").replaceAll("_", " "),
      description: String(item.reason ?? item.decision ?? "Persisted autonomy audit."),
      severity: String(item.action ?? "").includes("KILL") ? "CRITICAL" : "INFO",
      status: String(item.decision ?? "OK"),
      sourceId: String(item.resource ?? item.id ?? "autonomy-audit"),
      provenance: liveProvenance,
      executionReality: "ACTUAL",
      classification: "ACTUAL",
    }));
    if (liveEvents.length) {
      next.activity = [...liveEvents, ...next.activity.filter((event) => event.classification === "FIXTURE")].sort(
        (first, second) => second.timestamp.localeCompare(first.timestamp),
      );
    }
  }

  if (overlay.memory.state === "LIVE" && overlay.memory.memories.length) {
    const latest = overlay.memory.memories[0];
    if (latest?.insight) {
      next.learning = {
        ...next.learning,
        id: String(latest.id ?? next.learning.id),
        insight: latest.insight,
        evidenceCount: latest.evidence ? 1 : 0,
        source: latest.source ?? "governed_memories",
        classification: "ACTUAL",
        memoryState: latest.classification ?? "OBSERVATION",
        href: "/growth/memory",
        provenance: liveProvenance,
        executionReality: "ACTUAL",
        privilege: "DATA_ONLY",
      };
    }
    const memoryHealth = next.capabilities.find((item) => item.id === "health-memory");
    if (memoryHealth) {
      memoryHealth.capability = "AVAILABLE";
      memoryHealth.telemetryReality = "ACTUAL";
      memoryHealth.executionReality = "ACTUAL";
      memoryHealth.detail = `${overlay.memory.memories.length} persisted memories. Memory remains data and cannot grant privilege.`;
    }
  } else if (overlay.memory.state === "LIVE") {
    const memoryHealth = next.capabilities.find((item) => item.id === "health-memory");
    if (memoryHealth) {
      memoryHealth.capability = "AVAILABLE";
      memoryHealth.detail = "Live memory list is empty. Fixture learning remains labeled FIXTURE.";
    }
  }

  if (overlay.cost.state === "LIVE") {
    next.economics.classification = "ESTIMATED";
    next.economics.costKind = "ESTIMATED";
    next.economics.executionReality = "ESTIMATED";
    if (overlay.cost.usage.length) {
      const micros = overlay.cost.usage.reduce((sum, row) => sum + (row.estimated_micros ?? 0), 0);
      next.economics.estimatedTaskCost = Number((micros / 1_000_000).toFixed(4));
      next.economics.strategyComparison = `${overlay.cost.usage.length} estimated ledger rows · ${overlay.cost.costSource}`;
    }
    const costHealth = next.capabilities.find((item) => item.id === "health-economics");
    if (costHealth) {
      costHealth.capability = "AVAILABLE";
      costHealth.telemetryReality = "ESTIMATED";
      costHealth.executionReality = "ESTIMATED";
      costHealth.detail = "Live cost ledger is ESTIMATED. Not invoices or provider billing.";
    }
  }

  if (overlay.scenarios.state === "LIVE") {
    next.governance.scenarios.kind = "PROJECTED";
    const scenarioHealth = next.capabilities.find((item) => item.id === "health-scenarios");
    if (scenarioHealth) {
      scenarioHealth.capability = overlay.scenarios.scenarios.length ? "AVAILABLE" : "PENDING";
      scenarioHealth.telemetryReality = "PROJECTED";
      scenarioHealth.executionReality = "PROJECTED";
      scenarioHealth.detail = `${overlay.scenarios.scenarios.length} projected scenario records. Not historical actuals.`;
    }
  }

  if (overlay.accounts.state === "LIVE") {
    const youtube = youtubeConnected(overlay);
    const youtubeHealth = next.capabilities.find((item) => item.id === "health-youtube");
    if (youtubeHealth) {
      youtubeHealth.capability = youtube ? "PENDING" : "NOT_CONNECTED";
      youtubeHealth.executionReality = youtube ? "PENDING" : "NOT_CONNECTED";
      youtubeHealth.telemetryReality = youtube ? "PENDING" : "NOT_CONNECTED";
      youtubeHealth.detail = youtube
        ? "YouTube account present. This is not complete distribution/provider certification."
        : "YouTube is NOT_CONNECTED. Partial Phase 03 certification does not imply publication.";
    }
    const distMetric = next.metrics.find((item) => item.id === "distribution");
    if (distMetric) {
      distMetric.displayValue = String(overlay.accounts.accounts.length);
      distMetric.context = "Authenticated social account list · not publication proof";
      distMetric.classification = overlay.accounts.accounts.length ? "PENDING" : "NOT_CONNECTED";
      distMetric.executionReality = overlay.accounts.accounts.length ? "PENDING" : "NOT_CONNECTED";
    }
  }

  if (!overlay.authenticated) {
    next.situation.operatingState.summary =
      "Executive Command Center is aggregating fixture and pending sources. Authenticated BFF overlay was not available; fixture values remain labeled FIXTURE.";
  }

  return next;
}

export const executiveCommandService = {
  snapshot(): DataState<ExecutiveCommandData> {
    return validatedExecutiveWorkspace;
  },
  search(query: string, limit = 8): ExecutiveSearchRecord[] {
    return searchIndex(query, limit);
  },
  async getWorkspace(
    signal?: AbortSignal,
  ): Promise<DataState<ExecutiveCommandData>> {
    const overlay = await fetchExecutiveLive(signal);
    const base = validatedExecutiveWorkspace.data;
    if (!base) return validatedExecutiveWorkspace;
    if (overlay.session === "NOT_FETCHED" && typeof window !== "undefined") {
      await delay(180, signal);
    }
    return {
      ...validatedExecutiveWorkspace,
      data: applyExecutiveLiveOverlay(base, overlay),
      isDemo: overlay.session !== "LIVE",
      state: overlay.session === "LIVE" ? "live" : "demo",
    };
  },
};
