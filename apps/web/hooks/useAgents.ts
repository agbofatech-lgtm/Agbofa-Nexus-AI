"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AgentNotFoundError, agentService } from "@/lib/services/agents";
import { useAgentsStore } from "@/stores/agents-store";
import type { Agent, AgentCategory, AgentSummary } from "@/types/agents";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function matchesHealth(agent: Agent, filter: string): boolean {
  if (filter === "healthy") return agent.health >= 95;
  if (filter === "warning") return agent.health >= 80 && agent.health < 95;
  if (filter === "critical") return agent.health < 80;
  return true;
}

export function useAgents(categoryPreset?: readonly AgentCategory[]) {
  const state = useAgentsStore();
  const requestSequence = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (state.agents.length) return;
    const requestId = ++requestSequence.current;
    const controller = new AbortController();
    state.setLoading(true);
    state.setError(null);

    void agentService
      .getAgents(controller.signal)
      .then((agents) => {
        if (requestId === requestSequence.current) state.setAgents(agents);
      })
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || isAbortError(error))
          return;
        state.setError(
          error instanceof Error ? error.message : "Failed to load agents.",
        );
      })
      .finally(() => {
        if (requestId === requestSequence.current) state.setLoading(false);
      });

    return () => controller.abort();
    // Store actions are stable; refreshKey intentionally controls retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, state.agents.length]);

  const filteredAgents = useMemo(() => {
    const search = state.filters.search.trim().toLowerCase();
    return state.agents.filter(
      (agent) =>
        (!categoryPreset || categoryPreset.includes(agent.category)) &&
        (categoryPreset
          ? true
          : state.filters.category === "all" ||
            agent.category === state.filters.category) &&
        (state.filters.status === "all" ||
          agent.status === state.filters.status) &&
        matchesHealth(agent, state.filters.health) &&
        (!search ||
          `${agent.id} ${agent.name} ${agent.description}`
            .toLowerCase()
            .includes(search)),
    );
  }, [categoryPreset, state.agents, state.filters]);

  const summary = useMemo<AgentSummary>(() => {
    const scope = categoryPreset
      ? state.agents.filter((agent) => categoryPreset.includes(agent.category))
      : state.agents;
    return {
      total: scope.length,
      running: scope.filter((agent) => agent.status === "running").length,
      averageHealth: scope.length
        ? Number(
            (
              scope.reduce((total, agent) => total + agent.health, 0) /
              scope.length
            ).toFixed(1),
          )
        : 0,
      attention: scope.filter(
        (agent) => agent.status === "degraded" || agent.status === "failed",
      ).length,
    };
  }, [categoryPreset, state.agents]);

  const retry = useCallback(() => {
    state.setAgents([]);
    setRefreshKey((key) => key + 1);
  }, [state]);

  const hasActiveFilters =
    state.filters.category !== "all" ||
    state.filters.status !== "all" ||
    state.filters.health !== "all" ||
    Boolean(state.filters.search);

  return { ...state, filteredAgents, summary, hasActiveFilters, retry };
}

export function useAgent(agentId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    void agentService
      .getAgent(agentId, controller.signal)
      .then(setAgent)
      .catch((caught: unknown) => {
        if (isAbortError(caught)) return;
        if (caught instanceof AgentNotFoundError) {
          setNotFound(true);
          setAgent(null);
          return;
        }
        setError(
          caught instanceof Error ? caught.message : "Failed to load agent.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [agentId, refreshKey]);

  const retry = useCallback(() => setRefreshKey((key) => key + 1), []);
  return { agent, loading, error, notFound, retry };
}
