"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { newsroomService } from "@/lib/services/newsroom";
import { useNewsroomStore } from "@/stores/newsroom-store";
import type { PackageStatus } from "@/types/newsroom";

export type NewsroomSection =
  "dashboard" | "origination" | "factory" | "review";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useNewsroom(section: NewsroomSection) {
  const state = useNewsroomStore();
  const requestSequence = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    const controller = new AbortController();
    state.setLoading(section, true);
    state.setError(null);

    const load = async () => {
      switch (section) {
        case "dashboard": {
          const dashboard = await newsroomService.getDashboard(
            controller.signal,
          );
          if (requestId === requestSequence.current)
            state.setDashboard(dashboard);
          break;
        }
        case "origination": {
          const [sources, pipeline] = await Promise.all([
            newsroomService.getSources(controller.signal),
            newsroomService.getPipeline(controller.signal),
          ]);
          if (requestId === requestSequence.current) {
            state.setSources(sources);
            state.setPipeline(pipeline);
          }
          break;
        }
        case "factory": {
          const stories = await newsroomService.getFactoryStories(
            controller.signal,
          );
          if (requestId === requestSequence.current) {
            state.setFactoryStories(stories);
            if (!useNewsroomStore.getState().selectedStoryId) {
              state.setSelectedStoryId(stories[0]?.id ?? null);
            }
          }
          break;
        }
        case "review": {
          const items = await newsroomService.getReviewItems(controller.signal);
          if (requestId === requestSequence.current)
            state.setReviewItems(items);
          break;
        }
      }
    };

    void load()
      .catch((error: unknown) => {
        if (requestId !== requestSequence.current || isAbortError(error))
          return;
        state.setError(
          error instanceof Error ? error.message : "Failed to load newsroom.",
        );
      })
      .finally(() => {
        if (requestId === requestSequence.current)
          state.setLoading(section, false);
      });

    return () => controller.abort();
    // Store actions are stable; section and refreshKey intentionally drive loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, section]);

  const generatePackage = useCallback(async () => {
    const current = useNewsroomStore.getState();
    const story = current.factoryStories.find(
      (item) => item.id === current.selectedStoryId,
    );
    if (!story) {
      current.setError("Select a story before generating a package.");
      return;
    }
    current.setLoading("generating", true);
    current.setError(null);
    try {
      const generated = await newsroomService.generatePackage(
        story,
        current.packageTypes,
      );
      current.setGeneratedPackage(generated);
    } catch (error: unknown) {
      current.setError(
        error instanceof Error ? error.message : "Package generation failed.",
      );
    } finally {
      current.setLoading("generating", false);
    }
  }, []);

  const updatePackageStatus = useCallback(async (status: PackageStatus) => {
    const current = useNewsroomStore.getState();
    if (!current.generatedPackage) return;
    current.setLoading("generating", true);
    try {
      const updated = await newsroomService.updatePackageStatus(
        current.generatedPackage,
        status,
      );
      current.setGeneratedPackage(updated);
    } finally {
      current.setLoading("generating", false);
    }
  }, []);

  const retry = useCallback(() => setRefreshKey((key) => key + 1), []);

  return { ...state, generatePackage, updatePackageStatus, retry };
}
