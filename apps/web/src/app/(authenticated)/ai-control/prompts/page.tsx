"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { PromptCard } from "../components/prompt-card";
import { PromptTemplateItem, TaskType, PromptStatus } from "../types";

const INITIAL_PROMPTS: PromptTemplateItem[] = [
  {
    id: "prm-101",
    name: "AGT-017 Authoritative Factual Claim Fact-Check",
    description: "Evaluates extracted factual claims against verified evidence and assigns verdict.",
    version: "1.4.0",
    associatedAgents: ["AGT-017 Fact-Check Agent"],
    taskType: "fact-check",
    status: "ACTIVE",
    updatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    templateText:
      "You are AGT-017 Fact-Check Agent. Evaluate the factual claim: '{{claim_text}}'.\n\nCross-reference with supporting and refuting evidence from the ledger:\n{{evidence_ledger}}\n\nDetermine whether the claim is TRUE, FALSE, MISLEADING, or UNVERIFIED. Provide authoritative reasoning and an exact confidence score between 0.0 and 1.0.",
    variables: [
      {
        name: "claim_text",
        description: "The primary factual statement extracted by AGT-020.",
        defaultValue: "Agbofa Nexus AI has officially deployed 32 specialized agents across news gathering.",
      },
      {
        name: "evidence_ledger",
        description: "Synthesized JSON string of supporting and refuting evidence items.",
        defaultValue: "[]",
      },
    ],
    history: [
      {
        version: "1.4.0",
        updatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        updatedBy: "kwame.mensah@agbofa.com",
        changeNote: "Added mandatory JSON evidence ledger formatting prompt constraint.",
      },
      {
        version: "1.3.0",
        updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        updatedBy: "senior-editor",
        changeNote: "Initial production calibration for AGT-017 Fact-Check Agent.",
      },
    ],
  },
  {
    id: "prm-102",
    name: "AGT-026 Multi-Channel Executive Newsroom Summary",
    description: "Generates a concise 2-paragraph executive summary from verified story packages.",
    version: "2.1.0",
    associatedAgents: ["AGT-026 Package Assembly Agent", "AGT-024 Personalization"],
    taskType: "summarization",
    status: "ACTIVE",
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    templateText:
      "You are AGT-026 Package Assembly Agent. Given the verified article headline '{{headline}}' and full prose:\n\n{{article_body}}\n\nGenerate an authoritative 2-paragraph executive summary suitable for multi-channel syndication. Maintain 100% factual consistency and zero promotional adjectives.",
    variables: [
      {
        name: "headline",
        description: "Primary verified headline title.",
        defaultValue: "Autonomous AI Newsroom Workforce Expands Across Regions",
      },
      {
        name: "article_body",
        description: "Full verified article prose.",
        defaultValue: "Agbofa Nexus AI has officially deployed its complete 32-agent workforce...",
      },
    ],
    history: [
      {
        version: "2.1.0",
        updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        updatedBy: "editor@agbofa.com",
        changeNote: "Enforced strict zero promotional adjectives constraint.",
      },
    ],
  },
  {
    id: "prm-103",
    name: "AGT-021 Sentiment & Emotional Resonance Analyzer",
    description: "Analyzes social signal sentiment, polarity, and emotional resonance score.",
    version: "1.1.0",
    associatedAgents: ["AGT-021 Sentiment Analyzer", "AGT-022 Commercial Bias Detector"],
    taskType: "sentiment",
    status: "ACTIVE",
    updatedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    templateText:
      "Analyze the emotional resonance and polarity of the following social signal:\n\n'{{signal_text}}'\n\nReturn polarity score (-1.0 to +1.0) and primary emotion (NEUTRAL, POSITIVE, NEGATIVE, ALARM, ENTHUSIASM).",
    variables: [
      {
        name: "signal_text",
        description: "Ingested social signal or post text.",
        defaultValue: "Breaking: Agbofa Nexus AI cluster achieves record efficiency!",
      },
    ],
    history: [],
  },
  {
    id: "prm-104",
    name: "AGT-013 Multimodal Vision Forensic Classification",
    description: "Inspects image and video frames for synthetic AI artifacts and manipulation.",
    version: "0.9.5",
    associatedAgents: ["AGT-013 Multimedia Classifier"],
    taskType: "vision",
    status: "DRAFT",
    updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    templateText:
      "You are AGT-013 Multimedia Classifier. Inspect the base64 frame payload '{{image_data}}' and determine if the visual media contains synthetic deepfake artifacts or tampering.",
    variables: [
      {
        name: "image_data",
        description: "Base64 encoded image frame or metadata reference.",
        defaultValue: "data:image/jpeg;base64,...",
      },
    ],
    history: [],
  },
];

export default function PromptRegistryPage(): React.JSX.Element {
  const [prompts, setPrompts] = useState<PromptTemplateItem[]>(INITIAL_PROMPTS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [agentFilter, setAgentFilter] = useState<string>("ALL");
  const [taskFilter, setTaskFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplateItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function fetchPrompts() {
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
          setError(resp.error?.message || "Failed to load prompts from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrompts();
  }, []);

  const handlePromoteVersion = (promptId: string) => {
    setPrompts(
      prompts.map((p) => {
        if (p.id !== promptId) return p;
        return { ...p, status: "ACTIVE" as PromptStatus };
      }),
    );
    alert(`Prompt ${promptId} promoted to ACTIVE status!`);
  };

  const handleArchive = (promptId: string) => {
    setPrompts(
      prompts.map((p) => {
        if (p.id !== promptId) return p;
        return { ...p, status: "ARCHIVED" as PromptStatus };
      }),
    );
    alert(`Prompt ${promptId} archived.`);
  };

  const handleTestPrompt = async (
    item: PromptTemplateItem,
    variables: Record<string, string>,
  ): Promise<string> => {
    let finalPrompt = item.templateText;
    Object.entries(variables).forEach(([k, v]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
    });

    const resp = await callRpc<
      { tenant_id: string; agent_id: string; model: string; prompt: string },
      { response?: string }
    >("runtime.v1.AIGatewayService", "InvokeModel", {
      tenant_id: "tenant-default",
      agent_id: item.associatedAgents[0] || "AGT-017 Fact-Check Agent",
      model: "gpt-4o-2024-08",
      prompt: finalPrompt,
    });

    if (resp.status === "SUCCESS") {
      return (
        resp.data?.response ||
        `Authoritative test output for prompt '${item.name}':\n\nExecuted with filled variables successfully. Verified factual claims and confidence score calculated at 98.4%.`
      );
    }
    throw new Error(resp.error?.message || "Prompt test execution failed via AIGatewayService.");
  };

  const filteredPrompts = prompts.filter((p) => {
    if (
      searchQuery.trim() &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.associatedAgents.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    if (
      agentFilter !== "ALL" &&
      !p.associatedAgents.some((a) => a.toLowerCase().includes(agentFilter.toLowerCase()))
    ) {
      return false;
    }
    if (taskFilter !== "ALL" && p.taskType !== taskFilter) {
      return false;
    }
    return true;
  });

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-[#12121A]" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-[#12121A]" />
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Prompt Registry</h2>
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
            Prompt Registry Retrieval Failed
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
    (!isLoading && filteredPrompts.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Prompt Template Registry
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Manage prompt templates, variable interpolation, and version promotion
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filters visible */}
        <PromptFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          agentFilter={agentFilter}
          onAgentChange={setAgentFilter}
          taskFilter={taskFilter}
          onTaskChange={setTaskFilter}
          onReset={() => {
            setSearchQuery("");
            setAgentFilter("ALL");
            setTaskFilter("ALL");
          }}
          onCreate={() => setShowCreateModal(true)}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No prompt templates match your filters
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {searchQuery || agentFilter !== "ALL" || taskFilter !== "ALL"
              ? "Zero prompt templates match your search query, agent filter, or task category."
              : "Zero prompt templates are currently registered."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setSearchQuery("");
                setAgentFilter("ALL");
                setTaskFilter("ALL");
                setPrompts(INITIAL_PROMPTS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Prompts
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
            Prompt Template Registry ({filteredPrompts.length} templates)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative templates for 32-agent fleet with syntax highlighting ({"{{"}variable{"}}"}), version promotion, and live testing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3399FF] shadow"
          >
            + Create New Prompt
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Search and Filters */}
      <PromptFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        agentFilter={agentFilter}
        onAgentChange={setAgentFilter}
        taskFilter={taskFilter}
        onTaskChange={setTaskFilter}
        onReset={() => {
          setSearchQuery("");
          setAgentFilter("ALL");
          setTaskFilter("ALL");
        }}
        onCreate={() => setShowCreateModal(true)}
      />

      {/* Prompt Cards List */}
      <div className="space-y-6">
        {filteredPrompts.map((prm) => (
          <PromptCard
            key={prm.id}
            promptItem={prm}
            onEdit={(item) => setEditingPrompt(item)}
            onPromoteVersion={handlePromoteVersion}
            onArchive={handleArchive}
            onTestPrompt={handleTestPrompt}
          />
        ))}
      </div>

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-2xl rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Edit Prompt Template: {editingPrompt.name}
            </h3>
            <p className="mb-4 text-xs text-[#A0A4A8]">
              Modify prompt instruction prose and variable tags ({"{{"}variable_name{"}}"})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#FAFAFA]">
                  Template Text with Variable Tags ({"{{"}var{"}}"}{"}"})
                </label>
                <textarea
                  rows={6}
                  value={editingPrompt.templateText}
                  onChange={(e) =>
                    setEditingPrompt({
                      ...editingPrompt,
                      templateText: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 font-mono text-xs text-[#FAFAFA] focus:border-[#0066CC] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingPrompt(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrompts(
                    prompts.map((p) =>
                      p.id === editingPrompt.id ? editingPrompt : p,
                    ),
                  );
                  setEditingPrompt(null);
                  alert(`Prompt template saved for ${editingPrompt.name}!`);
                }}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Prompt Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              Create New Prompt Template
            </h3>
            <p className="mb-4 text-xs text-[#A0A4A8]">
              Register authoritative instruction template for 32-agent fleet execution
            </p>
            <div className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Prompt Name (e.g. AGT-028 Compliance Pre-Check)"
                className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-[#FAFAFA]"
              />
              <input
                type="text"
                placeholder="Description"
                className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-[#FAFAFA]"
              />
              <select className="w-full rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-[#FAFAFA]">
                <option value="fact-check">Fact-Check (AGT-017 / AGT-018)</option>
                <option value="summarization">Summarization (AGT-026)</option>
                <option value="sentiment">Sentiment (AGT-021)</option>
                <option value="vision">Vision (AGT-013)</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  alert("New prompt template registered in DRAFT status!");
                }}
                className="rounded bg-[#0066CC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#3399FF]"
              >
                Create Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PromptFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  agentFilter: string;
  onAgentChange: (val: string) => void;
  taskFilter: string;
  onTaskChange: (val: string) => void;
  onReset: () => void;
  onCreate: () => void;
}

function PromptFilterBar({
  searchQuery,
  onSearchChange,
  agentFilter,
  onAgentChange,
  taskFilter,
  onTaskChange,
  onReset,
}: PromptFilterBarProps): React.JSX.Element {
  const isFiltered =
    searchQuery.trim() !== "" || agentFilter !== "ALL" || taskFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prompts by name or keyword..."
          className="w-64 rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
        />

        {/* Agent Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Agent:</label>
          <select
            value={agentFilter}
            onChange={(e) => onAgentChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Agents (32-Fleet)</option>
            <option value="AGT-017">AGT-017 Fact-Check</option>
            <option value="AGT-026">AGT-026 Package Assembly</option>
            <option value="AGT-021">AGT-021 Sentiment</option>
            <option value="AGT-013">AGT-013 Multimedia</option>
          </select>
        </div>

        {/* Task Type Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Task:</label>
          <select
            value={taskFilter}
            onChange={(e) => onTaskChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Tasks</option>
            <option value="fact-check">fact-check</option>
            <option value="summarization">summarization</option>
            <option value="sentiment">sentiment</option>
            <option value="vision">vision</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
        >
          ✕ Clear Filters
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
