import { adaptExecutiveCommand } from "@/lib/adapters/executive-command";
import { mockStories } from "@/lib/mocks/stories";
import { growthIntelligenceService } from "@/lib/services/growth-intelligence";
import { phase1FoundationService } from "@/lib/services/phase1-foundation";
import { phase3ExperienceService } from "@/lib/services/phase3-experience";
import { phase5ExperienceService } from "@/lib/services/phase5-experience";
import { strategyDirectorService } from "@/lib/services/strategy-director";
import type { DataState } from "@/types/data-state";
import type {
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

function searchIndex(
  query: string,
  limit = 8,
): ExecutiveSearchRecord[] {
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
    await delay(260, signal);
    return validatedExecutiveWorkspace;
  },
};
