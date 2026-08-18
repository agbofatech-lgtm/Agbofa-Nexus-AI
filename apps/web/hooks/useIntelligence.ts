"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAgents } from "@/hooks/useAgents";
import { aiControlService } from "@/lib/services/ai-control";
import { mediaKindFor, multimodalService } from "@/lib/services/multimodal";
import { personalizationIntelligenceService } from "@/lib/services/personalization-intelligence";
import { predictiveService } from "@/lib/services/predictive";
import { useIntelligenceStore } from "@/stores/intelligence-store";
import type { MediaUploadState } from "@/types/multimodal";

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function useModuleLoader(
  module: "predictive" | "personalization" | "multimodal" | "aiControl",
) {
  const state = useIntelligenceStore();
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    state.setLoading(module, true);
    state.setError(module, null);
    const request =
      module === "predictive"
        ? predictiveService.getDashboard(controller.signal)
        : module === "personalization"
          ? personalizationIntelligenceService.getDashboard(controller.signal)
          : module === "multimodal"
            ? multimodalService.getWorkspace(controller.signal)
            : aiControlService.getDashboard(controller.signal);
    void request
      .then((data) => state.setModuleData(module, data))
      .catch((error: unknown) => {
        if (!isAbort(error))
          state.setError(
            module,
            error instanceof Error
              ? error.message
              : "Intelligence data unavailable.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) state.setLoading(module, false);
      });
    return () => controller.abort();
    // Store actions are stable; refreshKey intentionally drives retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, refreshKey]);
  const retry = useCallback(() => setRefreshKey((key) => key + 1), []);
  return { state, retry };
}

export function usePredictiveIntelligence() {
  const agents = useAgents();
  const { state, retry } = useModuleLoader("predictive");
  return {
    data: state.predictive,
    loading: state.loading.predictive,
    error: state.errors.predictive,
    agentSummary: agents.summary,
    retry,
  };
}

export function usePersonalizationIntelligence() {
  const { state, retry } = useModuleLoader("personalization");
  return {
    data: state.personalization,
    settings: state.settings,
    setSettings: state.setSettings,
    loading: state.loading.personalization,
    error: state.errors.personalization,
    retry,
  };
}

export function useAIControl() {
  const agents = useAgents();
  const { state, retry } = useModuleLoader("aiControl");
  return {
    data: state.aiControl,
    selectedProvider: state.selectedProvider,
    selectedModel: state.selectedModel,
    setSelectedProvider: state.setSelectedProvider,
    setSelectedModel: state.setSelectedModel,
    agentSummary: agents.summary,
    loading: state.loading.aiControl,
    error: state.errors.aiControl,
    retry,
  };
}

export function useMultimodalIntelligence() {
  const agents = useAgents();
  const { state, retry } = useModuleLoader("multimodal");
  const processingController = useRef<AbortController | null>(null);

  const processFile = useCallback(async (file: File) => {
    const current = useIntelligenceStore.getState();
    const kind = mediaKindFor(file);
    const maxBytes = 25 * 1_048_576;
    if (!kind) {
      current.setUpload({
        status: "error",
        error: "Use JPG, PNG, WebP, MP4, WebM, MP3, WAV, or OGG.",
        fileName: file.name,
      });
      return;
    }
    if (file.size > maxBytes) {
      current.setUpload({
        status: "error",
        error: "File exceeds the 25 MB demo limit.",
        fileName: file.name,
        mediaKind: kind,
      });
      return;
    }
    processingController.current?.abort();
    const controller = new AbortController();
    processingController.current = controller;
    current.setMediaAnalysis(null);
    current.setUpload({
      status: "validating",
      progress: 8,
      fileName: file.name,
      mediaKind: kind,
      error: null,
    });
    const steps: Array<Pick<MediaUploadState, "status" | "progress">> = [
      { status: "uploading", progress: 32 },
      { status: "processing", progress: 68 },
      { status: "processing", progress: 89 },
    ];
    try {
      for (const step of steps) {
        await new Promise((resolve) => window.setTimeout(resolve, 220));
        if (controller.signal.aborted) return;
        current.setUpload(step);
      }
      const analysis = await multimodalService.processDemo(
        file,
        controller.signal,
      );
      current.setMediaAnalysis(analysis);
      current.setUpload({ status: "success", progress: 100 });
    } catch (error: unknown) {
      if (!isAbort(error))
        current.setUpload({
          status: "error",
          error:
            error instanceof Error ? error.message : "Demo processing failed.",
        });
    }
  }, []);

  const agentExecutions = agents.agents
    .filter(
      (agent) => agent.category === "content" || agent.category === "platform",
    )
    .flatMap((agent) => agent.executions)
    .slice(0, 20);

  return {
    data: state.multimodal,
    analysis: state.mediaAnalysis,
    upload: state.upload,
    agentSummary: agents.summary,
    agentExecutions,
    loading: state.loading.multimodal,
    error: state.errors.multimodal,
    processFile,
    retry,
  };
}
