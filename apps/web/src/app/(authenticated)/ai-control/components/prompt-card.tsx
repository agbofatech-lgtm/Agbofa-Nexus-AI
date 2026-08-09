"use client";

import React, { useState } from "react";
import { PromptTemplateItem, PromptStatus } from "../types";

export interface PromptCardProps {
  promptItem: PromptTemplateItem;
  onEdit: (item: PromptTemplateItem) => void;
  onPromoteVersion: (promptId: string) => void;
  onArchive: (promptId: string) => void;
  onTestPrompt: (item: PromptTemplateItem, variables: Record<string, string>) => Promise<string>;
}

function getStatusBadge(status: PromptStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40 font-bold";
    case "DRAFT":
      return "bg-[#3399FF]/20 text-[#3399FF] border border-[#3399FF]/40 font-semibold";
    case "ARCHIVED":
    default:
      return "bg-[#2E2E32]/50 text-[#A0A4A8] border border-[#2E2E32]";
  }
}

// Highlights {{variable}} syntax in template text
function renderHighlightedTemplate(text: string): React.JSX.Element[] {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, index) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      return (
        <span
          key={index}
          className="rounded bg-[#0066CC]/30 px-1 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#0066CC]/50"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function PromptCard({
  promptItem,
  onEdit,
  onPromoteVersion,
  onArchive,
  onTestPrompt,
}: PromptCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"template" | "test" | "history">("template");

  // Test Runner variable input state
  const [testVars, setTestVars] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    promptItem.variables.forEach((v) => {
      init[v.name] = v.defaultValue || "Sample text value for " + v.name;
    });
    return init;
  });
  const [testResponse, setTestResponse] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const handleVariableChange = (name: string, val: string) => {
    setTestVars((prev) => ({ ...prev, [name]: val }));
  };

  const handleExecuteTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResponse("");
    try {
      const res = await onTestPrompt(promptItem, testVars);
      setTestResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing test prompt.";
      setTestResponse(`ERROR: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow transition-all hover:border-[#0066CC]">
      {/* Top Header & Status */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded bg-[#6C5CE7]/10 px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7] border border-[#6C5CE7]/30">
              {promptItem.taskType.toUpperCase()}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs ${getStatusBadge(
                promptItem.status,
              )}`}
            >
              {promptItem.status}
            </span>
            <span className="font-mono text-xs text-[#A0A4A8]">
              v:{promptItem.version}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-[#FAFAFA]">
            {promptItem.name} ({promptItem.id})
          </h3>
          <p className="text-xs text-[#A0A4A8]">{promptItem.description}</p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded border border-[#0066CC] bg-[#0066CC]/10 px-3 py-1.5 text-xs font-semibold text-[#3399FF] hover:bg-[#0066CC]/20"
          >
            {isExpanded ? "Hide Details ↑" : "Inspect & Test ↓"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(promptItem)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ✎ Edit
          </button>
          {promptItem.status !== "ACTIVE" && (
            <button
              type="button"
              onClick={() => onPromoteVersion(promptItem.id)}
              className="rounded bg-[#0D9040] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0D9040]/80"
            >
              ✓ Promote to ACTIVE
            </button>
          )}
          {promptItem.status !== "ARCHIVED" && (
            <button
              type="button"
              onClick={() => onArchive(promptItem.id)}
              className="rounded border border-[#CF2020]/40 bg-[#CF2020]/10 px-2.5 py-1.5 text-xs font-medium text-[#CF2020] hover:bg-[#CF2020]/20"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Associated 32-Agent Fleet Tags */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-semibold text-[#A0A4A8]">Associated Agents:</span>
        {promptItem.associatedAgents.map((ag) => (
          <span
            key={ag}
            className="rounded bg-[#0A0A0B] px-2 py-0.5 font-mono text-[11px] font-bold text-[#3399FF] border border-[#2E2E32]"
          >
            {ag}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-[#A0A4A8]">
          Updated: {new Date(promptItem.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Truncated Template Text Preview */}
      {!isExpanded && (
        <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 font-mono text-xs text-[#FAFAFA]">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#A0A4A8]">
            Template Preview (Truncated):
          </div>
          <div className="line-clamp-2">
            {renderHighlightedTemplate(promptItem.templateText)}
          </div>
        </div>
      )}

      {/* EXPANDED PROMPT WORKSPACE */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-[#2E2E32] pt-4">
          {/* Sub-nav tabs: Template | Test Prompt | Version History */}
          <div className="border-b border-[#2E2E32]">
            <nav className="flex space-x-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("template")}
                className={`pb-2 transition-colors ${
                  activeTab === "template"
                    ? "border-b-2 border-[#0066CC] text-[#FAFAFA]"
                    : "text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                📜 Full Template &amp; Variables ({promptItem.variables.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("test")}
                className={`pb-2 transition-colors ${
                  activeTab === "test"
                    ? "border-b-2 border-[#0066CC] text-[#FAFAFA]"
                    : "text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                ⚡ Test Prompt Runner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`pb-2 transition-colors ${
                  activeTab === "history"
                    ? "border-b-2 border-[#0066CC] text-[#FAFAFA]"
                    : "text-[#A0A4A8] hover:text-[#FAFAFA]"
                }`}
              >
                📜 Version History ({promptItem.history.length})
              </button>
            </nav>
          </div>

          {/* TAB 1: Full Template & Variables */}
          {activeTab === "template" && (
            <div className="space-y-4">
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4 font-mono text-xs leading-relaxed text-[#FAFAFA] whitespace-pre-wrap">
                {renderHighlightedTemplate(promptItem.templateText)}
              </div>

              {/* Variables List */}
              <div className="rounded-lg border border-[#2E2E32] bg-[#0A0A0B] p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
                  Template Variable Arguments
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {promptItem.variables.map((v) => (
                    <div
                      key={v.name}
                      className="rounded border border-[#2E2E32] bg-[#12121A] p-2 text-xs"
                    >
                      <span className="font-mono font-bold text-[#3399FF]">
                        {v.name}
                      </span>
                      <p className="mt-0.5 text-[11px] text-[#A0A4A8]">
                        {v.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Test Prompt Runner */}
          {activeTab === "test" && (
            <div className="rounded-lg border border-[#0066CC]/40 bg-[#0A0A0B] p-4 text-xs">
              <form onSubmit={handleExecuteTest} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2E2E32] pb-2">
                  <span className="font-semibold text-[#3399FF]">
                    ⚡ Variable Filling &amp; Live Test Runner
                  </span>
                  <span className="text-[10px] text-[#A0A4A8]">
                    Invokes AIGatewayService via BFF
                  </span>
                </div>

                {/* Variable input forms */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {promptItem.variables.map((v) => (
                    <div key={v.name} className="space-y-1">
                      <label className="block font-mono text-xs font-bold text-[#FAFAFA]">
                        {v.name}
                      </label>
                      <input
                        type="text"
                        value={testVars[v.name] || ""}
                        onChange={(e) =>
                          handleVariableChange(v.name, e.target.value)
                        }
                        placeholder={v.description}
                        className="w-full rounded border border-[#2E2E32] bg-[#12121A] px-2.5 py-1.5 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="rounded bg-[#0066CC] px-5 py-2 text-xs font-semibold text-white hover:bg-[#3399FF] disabled:opacity-50"
                  >
                    {isTesting
                      ? "Executing Test Prompt..."
                      : "⚡ Send Test Prompt to AIGatewayService"}
                  </button>
                </div>
              </form>

              {testResponse && (
                <div className="mt-4 rounded border border-[#2E2E32] bg-[#12121A] p-3 font-mono text-xs text-[#FAFAFA]">
                  <div className="mb-1 text-[10px] font-bold text-[#0D9040]">
                    ✓ AIGatewayService Response:
                  </div>
                  <p className="whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Version History Ledger */}
          {activeTab === "history" && (
            <div className="divide-y divide-[#2E2E32] rounded-lg border border-[#2E2E32] bg-[#0A0A0B]">
              {promptItem.history.map((h, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between gap-1 p-3 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-mono font-bold text-[#3399FF]">
                      Version {h.version}
                    </span>{" "}
                    <span className="text-[#A0A4A8]">by {h.updatedBy}</span>
                    <p className="mt-0.5 text-[#FAFAFA]">&ldquo;{h.changeNote}&rdquo;</p>
                  </div>
                  <span className="text-[11px] text-[#A0A4A8]">
                    {new Date(h.updatedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PromptCard;
