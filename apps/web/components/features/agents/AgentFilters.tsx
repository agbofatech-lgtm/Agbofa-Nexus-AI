"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button, Input, Select } from "@/components/ui";
import { useAgentsStore } from "@/stores/agents-store";
import type {
  AgentCategory,
  AgentHealthFilter,
  AgentStatus,
} from "@/types/agents";

const categoryOptions = [
  { value: "all", label: "All categories" },
  { value: "content", label: "Content" },
  { value: "verification", label: "Verification" },
  { value: "distribution", label: "Distribution" },
  { value: "analytics", label: "Analytics" },
  { value: "monetisation", label: "Monetisation" },
  { value: "platform", label: "Platform" },
];
const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "idle", label: "Idle" },
  { value: "queued", label: "Queued" },
  { value: "degraded", label: "Degraded" },
  { value: "failed", label: "Failed" },
  { value: "disabled", label: "Disabled" },
];
const healthOptions = [
  { value: "all", label: "All health" },
  { value: "healthy", label: "Healthy · ≥95%" },
  { value: "warning", label: "Warning · 80–94.9%" },
  { value: "critical", label: "Critical · <80%" },
];

interface AgentFiltersProps {
  compact?: boolean;
  categoryLocked?: boolean;
}

export function AgentFilters({
  compact = false,
  categoryLocked = false,
}: AgentFiltersProps) {
  const filters = useAgentsStore((state) => state.filters);
  const setCategory = useAgentsStore((state) => state.setCategory);
  const setStatus = useAgentsStore((state) => state.setStatus);
  const setHealth = useAgentsStore((state) => state.setHealth);
  const setSearch = useAgentsStore((state) => state.setSearch);
  const resetFilters = useAgentsStore((state) => state.resetFilters);
  const active =
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.health !== "all" ||
    Boolean(filters.search);

  return (
    <div
      className={
        compact ? "agent-filters agent-filters--compact" : "agent-filters glass"
      }
    >
      <span className="agent-filters__label">
        <SlidersHorizontal size={13} /> Filters
      </span>
      {!categoryLocked ? (
        <Select
          aria-label="Filter agents by category"
          onValueChange={(value) => setCategory(value as AgentCategory | "all")}
          options={categoryOptions}
          value={filters.category}
        />
      ) : null}
      <Select
        aria-label="Filter agents by status"
        onValueChange={(value) => setStatus(value as AgentStatus | "all")}
        options={statusOptions}
        value={filters.status}
      />
      <Select
        aria-label="Filter agents by health"
        onValueChange={(value) => setHealth(value as AgentHealthFilter)}
        options={healthOptions}
        value={filters.health}
      />
      <Input
        aria-label="Search agents"
        icon={<Search size={15} />}
        onChange={setSearch}
        placeholder="Search ID, name, or description..."
        type="search"
        value={filters.search}
      />
      {active ? (
        <Button
          aria-label="Reset agent filters"
          onClick={resetFilters}
          size="sm"
          variant="ghost"
        >
          <RotateCcw size={13} /> Reset
        </Button>
      ) : null}
    </div>
  );
}
