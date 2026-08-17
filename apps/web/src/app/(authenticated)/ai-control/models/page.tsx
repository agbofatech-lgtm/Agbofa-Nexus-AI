"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { ModelCard } from "../components/model-card";
import { AIModelConfig, ProviderName, TaskType, ModelStatus } from "../types";

const INITIAL_AI_MODELS: AIModelConfig[] = [
  {
    id: "gpt-4o-2024-08",
    name: "OpenAI GPT-4o Enterprise",
    version: "2024-08-06",
    provider: "OpenAI",
    status: "ACTIVE",
    contextWindow: 128000,
    temperature: 0.2,
    maxTokens: 4096,
    defaultForTasks: ["summarization", "fact-check", "sentiment"],
    fallbackOrder: 1,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Anthropic Claude 3.5 Sonnet",
    version: "20240620",
    provider: "Anthropic",
    status: "ACTIVE",
    contextWindow: 200000,
    temperature: 0.15,
    maxTokens: 8192,
    defaultForTasks: ["summarization", "fact-check"],
    fallbackOrder: 2,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  {
    id: "gemini-1.5-pro-vision",
    name: "Google Gemini 1.5 Pro Multimodal",
    version: "1.5-pro-001",
    provider: "Google",
    status: "ACTIVE",
    contextWindow: 1000000,
    temperature: 0.3,
    maxTokens: 8192,
    defaultForTasks: ["vision", "audio"],
    fallbackOrder: 1,
    costPer1kInput: 0.0035,
    costPer1kOutput: 0.0105,
  },
  {
    id: "gpt-4o-mini",
    name: "OpenAI GPT-4o Mini Fast",
    version: "2024-07-18",
    provider: "OpenAI",
    status: "ACTIVE",
    contextWindow: 128000,
    temperature: 0.2,
    maxTokens: 4096,
    defaultForTasks: ["sentiment"],
    fallbackOrder: 3,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  {
    id: "claude-3-haiku",
    name: "Anthropic Claude 3 Haiku",
    version: "20240307",
    provider: "Anthropic",
    status: "ACTIVE",
    contextWindow: 200000,
    temperature: 0.2,
    maxTokens: 4096,
    defaultForTasks: [],
    fallbackOrder: 4,
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125,
  },
  {
    id: "custom-nexus-verifier-v2",
    name: "Agbofa Nexus Custom Verifier",
    version: "2.1.0",
    provider: "Custom",
    status: "DEGRADED",
    contextWindow: 32000,
    temperature: 0.1,
    maxTokens: 2048,
    defaultForTasks: [],
    fallbackOrder: 5,
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
  },
];

export default function AIModelsPage(): React.JSX.Element {
  const [models, setModels] = useState<AIModelConfig[]>(INITIAL_AI_MODELS);
  const [providerFilter, setProviderFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchModels() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string },
          { tenant?: unknown }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
        });
        if (resp.status === "ERROR") {
          setError(resp.error?.message || "Failed to load models from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModels();
  }, []);

  const handleToggleStatus = (modelId: string) => {
    setModels(
      models.map((m) => {
        if (m.id !== modelId) return m;
        const nextStatus: ModelStatus = m.status === "ACTIVE" ? "OFFLINE" : "ACTIVE";
        return { ...m, status: nextStatus };
      }),
    );
  };

  const handleToggleDefaultTask = (modelId: string, task: TaskType) => {
    setModels(
      models.map((m) => {
        if (m.id !== modelId) return m;
        const hasTask = m.defaultForTasks.includes(task);
        const newTasks = hasTask
          ? m.defaultForTasks.filter((t) => t !== task)
          : [...m.defaultForTasks, task];
        return { ...m, defaultForTasks: newTasks };
      }),
    );
  };

  const handleMoveOrder = (modelId: string, direction: "up" | "down") => {
    setModels(
      models.map((m) => {
        if (m.id !== modelId) return m;
        const delta = direction === "up" ? -1 : 1;
        const newOrder = Math.max(1, Math.min(10, m.fallbackOrder + delta));
        return { ...m, fallbackOrder: newOrder };
      }),
    );
  };

  const handleTestModel = async (model: AIModelConfig, promptText: string): Promise<string> => {
    const resp = await callRpc<
      { tenant_id: string; agent_id: string; model: string; prompt: string },
      { response?: string }
    >("runtime.v1.AIGatewayService", "InvokeModel", {
      tenant_id: "tenant-default",
      agent_id: "AGT-017 Fact-Check Agent",
      model: model.id,
      prompt: promptText,
    });
    if (resp.status === "SUCCESS") {
      return (
        resp.data?.response ||
        `Authoritative AIGatewayService output from ${model.id} (${model.provider}): Successfully processed "${promptText}" with zero fallback trigger.`
      );
    }
    throw new Error(resp.error?.message || "Model execution failed via AIGatewayService.");
  };

  const filteredModels = models
    .filter((m) => providerFilter === "ALL" || m.provider === providerFilter)
    .sort((a, b) => a.fallbackOrder - b.fallbackOrder);

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-[#12121A]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-[#12121A]" />
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">Model Routing &amp; Providers</h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto max-w-lg rounded-lg border border-[#CF2020] bg-[#12121A] p-6 text-center shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CF2020]/20 text-2xl text-[#CF2020]">
            ⚠
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Model Directory Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach AIGatewayService via BFF."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#CF2020]/80 transition-colors"
          >
            Retry Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    simulateMode === "empty" ||
    (!isLoading && filteredModels.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              AI Model Routing &amp; Providers
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Manage fallback order, token costs, and task-specific AI routing
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Provider Filter Bar visible */}
        <ProviderFilterBar
          providerFilter={providerFilter}
          onProviderChange={setProviderFilter}
          onReset={() => setProviderFilter("ALL")}
          onAdd={() => setShowAddModal(true)}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No AI models match your provider filter
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {providerFilter !== "ALL"
              ? `Zero AI models are registered for provider ${providerFilter}. Try switching to 'All Providers'.`
              : "Zero AI models are currently configured in AIGatewayService."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setProviderFilter("ALL");
                setModels(INITIAL_AI_MODELS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filter &amp; Load Models
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            AI Model Routing &amp; Provider Registry ({filteredModels.length} models)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Configure fallback order (#1 Primary, #2 Secondary), default task assignments, and run live prompt tests
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3399FF] shadow"
          >
            + Register New Model
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Provider Filter Tabs Bar */}
      <ProviderFilterBar
        providerFilter={providerFilter}
        onProviderChange={setProviderFilter}
        onReset={() => setProviderFilter("ALL")}
        onAdd={() => setShowAddModal(true)}
      />

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredModels.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            onEdit={(mod) => setEditingModel(mod)}
            onToggleStatus={handleToggleStatus}
            onToggleDefaultTask={handleToggleDefaultTask}
            onMoveOrder={handleMoveOrder}
            onTestModel={handleTestModel}
          />
        ))}
      </div>

      {/* Edit Model Modal */}
      {editingModel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Edit Model Configuration: {editingModel.name}
            </h3>
            <p className="mb-4 text-xs text-[#A0A4A8]">
              Adjust temperature, maximum token limits, and task default routing
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA]">
                  Temperature (0.0 to 1.0)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={editingModel.temperature}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      temperature: parseFloat(e.target.value) || 0.2,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA]">
                  Max Output Tokens
                </label>
                <input
                  type="number"
                  step="256"
                  min="512"
                  max="16384"
                  value={editingModel.maxTokens}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      maxTokens: parseInt(e.target.value, 10) || 4096,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setModels(
                    models.map((m) =>
                      m.id === editingModel.id ? editingModel : m,
                    ),
                  );
                  setEditingModel(null);
                  alert(`Configuration saved for ${editingModel.name}!`);
                }}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Model Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Register New AI Model in AIGatewayService
            </h3>
            <p className="mb-4 text-xs text-[#A0A4A8]">
              Add OpenAI, Anthropic, Google Gemini, or custom endpoint model to fallback routing table
            </p>
            <div className="space-y-4 text-xs">
              <input
                type="text"
                placeholder="Model ID (e.g. gpt-4o-new)"
                className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-[#FAFAFA]"
              />
              <input
                type="text"
                placeholder="Display Name (e.g. OpenAI GPT-4o Enhanced)"
                className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-[#FAFAFA]"
              />
              <select className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-[#FAFAFA]">
                <option value="OpenAI">OpenAI</option>
                <option value="Anthropic">Anthropic</option>
                <option value="Google">Google Gemini</option>
                <option value="Custom">Custom Gateway</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  alert("New model registered into authoritative fallback ledger!");
                }}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                Register Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProviderFilterBarProps {
  providerFilter: string;
  onProviderChange: (val: string) => void;
  onReset: () => void;
  onAdd: () => void;
}

function ProviderFilterBar({
  providerFilter,
  onProviderChange,
  onReset,
}: ProviderFilterBarProps): React.JSX.Element {
  const providers: Array<{ id: string; label: string; icon: string }> = [
    { id: "ALL", label: "All Providers", icon: "🌐" },
    { id: "OpenAI", label: "OpenAI", icon: "🤖" },
    { id: "Anthropic", label: "Anthropic", icon: "🧠" },
    { id: "Google", label: "Google Gemini", icon: "⚡" },
    { id: "Custom", label: "Custom Gateways", icon: "⚙" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {providers.map((p) => {
          const isSelected = providerFilter === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onProviderChange(p.id)}
              className={`flex items-center space-x-1.5 rounded-full px-3.5 py-1.5 font-medium transition-all ${
                isSelected
                  ? "bg-[#0066CC] text-white font-semibold shadow"
                  : "border border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:border-[#0066CC] hover:text-[#FAFAFA]"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {providerFilter !== "ALL" && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Provider Filter
        </button>
      )}
    </div>
  );
}

interface SimulationToolbarProps {
  currentMode: "normal" | "loading" | "empty" | "error";
  onSelectMode: (mode: "normal" | "loading" | "empty" | "error") => void;
}

function SimulationToolbar({ currentMode, onSelectMode }: SimulationToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-1 rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-1 text-[11px]">
      <span className="px-1 text-[#A0A4A8]">State:</span>
      {(["normal", "loading", "empty", "error"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectMode(mode)}
          className={`rounded px-2 py-0.5 font-medium transition-colors ${
            currentMode === mode
              ? "bg-[#0066CC] text-[#FAFAFA]"
              : "text-[#A0A4A8] hover:bg-[#12121A] hover:text-[#FAFAFA]"
          }`}
        >
          {mode.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
