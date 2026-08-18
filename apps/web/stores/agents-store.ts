import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type {
  Agent,
  AgentCategory,
  AgentFilters,
  AgentHealthFilter,
  AgentStatus,
} from "@/types/agents";

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  filters: AgentFilters;
  mobileFiltersOpen: boolean;
  setAgents: (agents: Agent[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCategory: (category: AgentCategory | "all") => void;
  setStatus: (status: AgentStatus | "all") => void;
  setHealth: (health: AgentHealthFilter) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  setMobileFiltersOpen: (open: boolean) => void;
}

const defaultFilters: AgentFilters = {
  category: "all",
  status: "all",
  health: "all",
  search: "",
};

export const useAgentsStore = create<AgentsState>()(
  devtools(
    (set) => ({
      agents: [],
      loading: true,
      error: null,
      filters: { ...defaultFilters },
      mobileFiltersOpen: false,
      setAgents: (agents) => set({ agents }, false, "agents/setAgents"),
      setLoading: (loading) => set({ loading }, false, "agents/setLoading"),
      setError: (error) => set({ error }, false, "agents/setError"),
      setCategory: (category) =>
        set(
          (state) => ({ filters: { ...state.filters, category } }),
          false,
          "agents/setCategory",
        ),
      setStatus: (status) =>
        set(
          (state) => ({ filters: { ...state.filters, status } }),
          false,
          "agents/setStatus",
        ),
      setHealth: (health) =>
        set(
          (state) => ({ filters: { ...state.filters, health } }),
          false,
          "agents/setHealth",
        ),
      setSearch: (search) =>
        set(
          (state) => ({ filters: { ...state.filters, search } }),
          false,
          "agents/setSearch",
        ),
      resetFilters: () =>
        set({ filters: { ...defaultFilters } }, false, "agents/resetFilters"),
      setMobileFiltersOpen: (mobileFiltersOpen) =>
        set({ mobileFiltersOpen }, false, "agents/setMobileFiltersOpen"),
    }),
    {
      name: "AgbofaAgentsStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
