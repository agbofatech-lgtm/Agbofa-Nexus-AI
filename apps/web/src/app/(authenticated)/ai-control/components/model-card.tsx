"use client";

import React, { useState } from "react";
import { AIModelConfig, TaskType, ProviderName } from "../types";

export interface ModelCardProps {
  model: AIModelConfig;
  onEdit: (model: AIModelConfig) => void;
  onToggleStatus: (modelId: string) => void;
  onToggleDefaultTask: (modelId: string, task: TaskType) => void;
  onMoveOrder: (modelId: string, direction: "up" | "down") => void;
  onTestModel: (model: AIModelConfig, promptText: string) => Promise<string>;
}

function getProviderBadge(provider: ProviderName): { label: string; style: string; icon: string } {
  switch (provider) {
    case "OpenAI":
      return {
        label: "OpenAI",
        style: "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40",
        icon: "🤖",
      };
    case "Anthropic":
      return {
        label: "Anthropic",
        style: "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40",
        icon: "🧠",
      };
    case "Google":
      return {
        label: "Google Gemini",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40",
        icon: "⚡",
      };
    case "Custom":
    default:
      return {
        label: "Custom Gateway",
        style: "bg-[#2E2E32]/50 text-[#FAFAFA] border border-[#2E2E32]",
        icon: "⚙",
      };
  }
}

function getStatusStyle(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold";
    case "DEGRADED":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold";
    case "OFFLINE":
    default:
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold";
  }
}

const ALL_TASKS: TaskType[] = [
  "summarization",
  "fact-check",
  "sentiment",
  "vision",
  "audio",
];

export function ModelCard({
  model,
  onEdit,
  onToggleStatus,
  onToggleDefaultTask,
  onMoveOrder,
  onTestModel,
}: ModelCardProps): React.JSX.Element {
  const [showTestRunner, setShowTestRunner] = useState<boolean>(false);
  const [testInput, setTestInput] = useState<string>(
    "Summarize the recent expansion of the Agbofa Nexus AI 32-agent workforce.",
  );
  const [testResponse, setTestResponse] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const providerBadge = getProviderBadge(model.provider);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestResponse("");
    try {
      const res = await onTestModel(model, testInput.trim());
      setTestResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error running test prompt.";
      setTestResponse(`ERROR: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow transition-all hover:border-[#0066CC]">
      <div>
        {/* Top bar: Provider Badge & Status */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold ${providerBadge.style}`}
          >
            <span aria-hidden="true">{providerBadge.icon}</span>
            <span>{providerBadge.label}</span>
          </span>
          <div className="flex items-center space-x-2">
            <span className="rounded bg-[#0A0A0B] px-2 py-0.5 text-[11px] font-mono text-[#A0A4A8] border border-[#2E2E32]">
              Order #{model.fallbackOrder}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${getStatusStyle(
                model.status,
              )}`}
            >
              <span className="mr-1.5 h-2 w-2 rounded-full bg-current" />
              {model.status}
            </span>
          </div>
        </div>

        {/* Model Name & Version */}
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-base font-bold text-[#FAFAFA]">{model.name}</h3>
          <span className="text-xs font-mono text-[#A0A4A8]">v:{model.version}</span>
        </div>

        {/* Technical Configuration Grid */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 text-center text-xs">
          <div>
            <div className="text-[10px] text-[#A0A4A8]">Context Window</div>
            <div className="font-bold text-[#FAFAFA]">
              {(model.contextWindow / 1000).toFixed(0)}k tokens
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#A0A4A8]">Temperature</div>
            <div className="font-bold text-[#3399FF]">{model.temperature}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#A0A4A8]">Max Output</div>
            <div className="font-bold text-[#6C5CE7]">
              {model.maxTokens} tokens
            </div>
          </div>
        </div>

        {/* Default Task Assignments */}
        <div className="mb-4 space-y-2 border-t border-[#2E2E32] pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#A0A4A8]">
              Default Route For Task Types:
            </span>
            <span className="text-[10px] text-[#3399FF]">Click to toggle</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TASKS.map((task) => {
              const isDefault = model.defaultForTasks.includes(task);
              return (
                <button
                  key={task}
                  type="button"
                  onClick={() => onToggleDefaultTask(model.id, task)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    isDefault
                      ? "bg-[#0066CC] text-white font-semibold shadow-sm"
                      : "border border-[#2E2E32] bg-[#0A0A0B] text-[#A0A4A8] hover:border-[#0066CC] hover:text-[#FAFAFA]"
                  }`}
                >
                  {isDefault ? "★ " : ""}
                  {task}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions & Fallback Reorder Controls */}
      <div className="space-y-3 border-t border-[#2E2E32] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-[#A0A4A8]">Priority:</span>
            <button
              type="button"
              disabled={model.fallbackOrder <= 1}
              onClick={() => onMoveOrder(model.id, "up")}
              className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] disabled:opacity-40"
              title="Move higher in fallback order"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={model.fallbackOrder >= 5}
              onClick={() => onMoveOrder(model.id, "down")}
              className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] disabled:opacity-40"
              title="Move lower in fallback order"
            >
              ↓
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowTestRunner(!showTestRunner)}
              className="rounded border border-[#0066CC] bg-[#0066CC]/10 px-3 py-1.5 text-xs font-semibold text-[#3399FF] hover:bg-[#0066CC]/20"
            >
              {showTestRunner ? "Close Test ↑" : "⚡ Test Model"}
            </button>
            <button
              type="button"
              onClick={() => onEdit(model)}
              className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
            >
              ✎ Config
            </button>
            <button
              type="button"
              onClick={() => onToggleStatus(model.id)}
              className={`rounded px-3 py-1.5 text-xs font-bold text-white ${
                model.status === "ACTIVE"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#0D9040] hover:bg-[#0D9040]/80"
              }`}
            >
              {model.status === "ACTIVE" ? "Pause" : "Activate"}
            </button>
          </div>
        </div>

        {/* Live Test Prompt Runner Panel */}
        {showTestRunner && (
          <div className="rounded-lg border border-[#0066CC]/40 bg-[#0A0A0B] p-3 text-xs">
            <form onSubmit={handleRunTest} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#3399FF]">
                  ⚡ AIGatewayService Live Test Runner ({model.id})
                </span>
                <span className="text-[10px] text-[#A0A4A8]">
                  Invokes runtime.v1.AIGatewayService
                </span>
              </div>
              <textarea
                rows={2}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Enter a test prompt..."
                className="w-full rounded border border-[#2E2E32] bg-[#12121A] p-2 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
              />
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF] disabled:opacity-50"
                >
                  {isTesting ? "Executing Prompt..." : "Send Test Prompt →"}
                </button>
              </div>
            </form>

            {testResponse && (
              <div className="mt-3 rounded border border-[#2E2E32] bg-[#12121A] p-2.5 font-mono text-xs text-[#FAFAFA]">
                <div className="mb-1 text-[10px] font-bold text-[#0D9040]">
                  ✓ Model Response:
                </div>
                <p className="whitespace-pre-wrap">{testResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModelCard;
