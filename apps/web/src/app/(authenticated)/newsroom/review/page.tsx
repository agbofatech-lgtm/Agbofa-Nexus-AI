"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { StoryList, ColumnConfig } from "../components/story-list";
import { StoryListRowModel } from "../components/story-row";
import { ReviewActions } from "../components/review-actions";
import {
  ReviewItem,
  ReviewStatus,
  OriginationPriority,
  PackageType,
} from "../types";

const INITIAL_REVIEW_ITEMS: ReviewItem[] = [
  {
    packageId: "pkg-101",
    storyId: "story-101",
    headline: "Autonomous AI Newsroom Workforce Expands Across Regions",
    packageType: "MULTI_CHANNEL",
    priority: "BREAKING",
    submittedBy: "AGT-026 Package Assembly Agent",
    submittedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "PENDING",
    reviewerNotes: "Awaiting senior editorial sign-off for Reuters syndication.",
    comments: [
      {
        commentId: "cmt-1",
        author: "Editor in Chief",
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
        text: "Please verify that the 4-post X thread tags @AgbofaNewsroom properly.",
      },
    ],
    history: [
      {
        historyId: "hst-1",
        reviewer: "AGT-028 Compliance Pre-Checker",
        decidedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        decision: "APPROVED",
        reason: "Zero copyright, legal, or brand originality flags detected.",
      },
    ],
    packageDetail: {
      packageId: "pkg-101",
      storyId: "story-101",
      packageType: "MULTI_CHANNEL",
      status: "PENDING_REVIEW",
      factualConsistencyVerified: true,
      compliancePreCheckPassed: true,
      sourceAttributionComplete: true,
      brandVoiceScore: {
        compatibilityScore: 0.96,
        toneAnalysis: ["Authoritative", "Analytical", "Factual"],
        mismatchWarnings: [],
        recommendations: [],
      },
      assets: [
        {
          assetId: "ast-1",
          type: "ARTICLE_BODY",
          title: "Primary Article & SEO Ledger",
          content:
            "Agbofa Nexus AI has officially deployed its complete 32-agent workforce across News Gathering, Content Detection, Verification, and Pipeline Orchestration. The autonomous newsroom operates continuously, cross-referencing multi-source wire feeds.",
          status: "PRESENT",
          required: true,
        },
        {
          assetId: "ast-2",
          type: "SOCIAL_THREAD_X",
          title: "Twitter/X 4-Post Verified Thread",
          content:
            "1/4 BREAKING: Agbofa Nexus AI deploys 32 specialized autonomous agents across global newsrooms. ⚡\n\n2/4 Fact-checking (AGT-017) and cross-media consistency (AGT-013-CROSS) operate at 99.2% alignment.",
          status: "PRESENT",
          required: true,
        },
      ],
    },
  },
  {
    packageId: "pkg-102",
    storyId: "story-102",
    headline: "Predictive Intelligence Engines Scale Calibration Metrics",
    packageType: "ARTICLE",
    priority: "HIGH",
    submittedBy: "AGT-026 Package Assembly Agent",
    submittedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    status: "REVISION_REQUESTED",
    reviewerNotes: "Requested dampening of promotional adjectives in executive quote.",
    comments: [
      {
        commentId: "cmt-2",
        author: "Senior Copy Editor",
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        text: "We need specific MAPE accuracy percentages instead of saying 'industry-leading'.",
      },
    ],
    history: [
      {
        historyId: "hst-2",
        reviewer: "Senior Copy Editor",
        decidedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        decision: "REVISION_REQUESTED",
        reason: "Commercial promotional tone requires dampening per Brand Voice Guidelines.",
      },
    ],
  },
  {
    packageId: "pkg-103",
    storyId: "story-103",
    headline: "Row-Level Security Enforces Strict Tenant Boundaries in Postgres",
    packageType: "ARTICLE",
    priority: "STANDARD",
    submittedBy: "Senior Technical Editor",
    submittedAt: new Date(Date.now() - 110 * 60000).toISOString(),
    status: "APPROVED",
    reviewerNotes: "Approved for publication to Reader Feed and syndication channels.",
    comments: [],
    history: [
      {
        historyId: "hst-3",
        reviewer: "Senior Technical Editor",
        decidedAt: new Date(Date.now() - 60 * 60000).toISOString(),
        decision: "APPROVED",
        reason: "All 16 greenfield verification and RLS isolation tests passed.",
      },
    ],
  },
];

const COLUMNS: ColumnConfig[] = [
  { key: "packageType", label: "Format / Type", sortable: true },
  { key: "headline", label: "Headline & Submitter", sortable: true },
  { key: "submittedAt", label: "Submitted At", sortable: true },
  { key: "priority", label: "Priority", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

export default function EditorialReviewPage(): React.JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<ReviewItem[]>(INITIAL_REVIEW_ITEMS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItemId, setActiveItemId] = useState<string>(
    INITIAL_REVIEW_ITEMS[0].packageId,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [submitterFilter, setSubmitterFilter] = useState<string>("ALL");

  const [simulateMode, setSimulateMode] = useState<"normal" | "loading" | "empty" | "error">("normal");

  useEffect(() => {
    async function loadReviewQueue() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; status_filter: string },
          { packages?: unknown[] }
        >("content_factory.v1.ContentFactoryService", "ListPackages", {
          tenant_id: "tenant-default",
          status_filter: "APPROVED",
        });
        if (resp.status === "ERROR") {
          setError(resp.error?.message || "Failed to load review queue from BFF.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadReviewQueue();
  }, []);

  const activeItem =
    items.find((i) => i.packageId === activeItemId) || items[0];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map((i) => i.packageId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleApprove = (item: ReviewItem, notes: string) => {
    const now = new Date().toISOString();
    const updated = items.map((i) => {
      if (i.packageId !== item.packageId) return i;
      return {
        ...i,
        status: "APPROVED" as const,
        reviewerNotes: notes || i.reviewerNotes,
        history: [
          {
            historyId: `hst-${Date.now()}`,
            reviewer: "Editor in Chief (Current User)",
            decidedAt: now,
            decision: "APPROVED" as const,
            reason: notes || "Approved for immediate multi-channel distribution.",
          },
          ...i.history,
        ],
      };
    });
    setItems(updated);
  };

  const handleReject = (item: ReviewItem, reason: string) => {
    const now = new Date().toISOString();
    const updated = items.map((i) => {
      if (i.packageId !== item.packageId) return i;
      return {
        ...i,
        status: "REJECTED" as const,
        reviewerNotes: reason,
        history: [
          {
            historyId: `hst-${Date.now()}`,
            reviewer: "Editor in Chief (Current User)",
            decidedAt: now,
            decision: "REJECTED" as const,
            reason: reason || "Rejected per editorial guidelines.",
          },
          ...i.history,
        ],
      };
    });
    setItems(updated);
  };

  const handleRequestRevision = (item: ReviewItem, requests: string) => {
    const now = new Date().toISOString();
    const updated = items.map((i) => {
      if (i.packageId !== item.packageId) return i;
      return {
        ...i,
        status: "REVISION_REQUESTED" as const,
        reviewerNotes: requests,
        history: [
          {
            historyId: `hst-${Date.now()}`,
            reviewer: "Editor in Chief (Current User)",
            decidedAt: now,
            decision: "REVISION_REQUESTED" as const,
            reason: requests || "Revision requested before publication.",
          },
          ...i.history,
        ],
      };
    });
    setItems(updated);
  };

  const handleAddComment = (item: ReviewItem, commentText: string) => {
    const updated = items.map((i) => {
      if (i.packageId !== item.packageId) return i;
      return {
        ...i,
        comments: [
          ...i.comments,
          {
            commentId: `cmt-${Date.now()}`,
            author: "Editor in Chief (Current User)",
            createdAt: new Date().toISOString(),
            text: commentText,
          },
        ],
      };
    });
    setItems(updated);
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    const now = new Date().toISOString();
    const updated = items.map((i) => {
      if (!selectedIds.includes(i.packageId)) return i;
      return {
        ...i,
        status: "APPROVED" as const,
        history: [
          {
            historyId: `hst-${Date.now()}`,
            reviewer: "Editor in Chief (Bulk Action)",
            decidedAt: now,
            decision: "APPROVED" as const,
            reason: "Bulk approved from Editorial Review queue.",
          },
          ...i.history,
        ],
      };
    });
    setItems(updated);
    setSelectedIds([]);
  };

  const handleBulkDeadline = () => {
    alert(`Review deadline set for ${selectedIds.length} selected packages: Today 18:00 UTC.`);
  };

  const filteredItems = items.filter((it) => {
    if (statusFilter !== "ALL" && it.status !== statusFilter) {
      return false;
    }
    if (typeFilter !== "ALL" && it.packageType !== typeFilter) {
      return false;
    }
    if (priorityFilter !== "ALL" && it.priority !== priorityFilter) {
      return false;
    }
    if (
      submitterFilter !== "ALL" &&
      !it.submittedBy.toLowerCase().includes(submitterFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const rowModels: StoryListRowModel[] = filteredItems.map((it) => ({
    id: it.packageId,
    headline: it.headline,
    packageType: it.packageType,
    submittedBy: it.submittedBy,
    submittedAt: it.submittedAt,
    priority: it.priority,
    status: it.status,
  }));

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-64 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-[#12121A]" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#12121A]" />
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Editorial Review Queue</h2>
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
            Review Queue Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error || "Simulated error: unable to reach ContentFactoryService via BFF."}
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
    (!isLoading && filteredItems.length === 0 && simulateMode === "normal")
  ) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E32] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Editorial Review Queue
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Final editorial sign-off for multi-platform distribution
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filters still visible */}
        <ReviewFilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          submitterFilter={submitterFilter}
          onSubmitterChange={setSubmitterFilter}
          onReset={() => {
            setStatusFilter("ALL");
            setTypeFilter("ALL");
            setPriorityFilter("ALL");
            setSubmitterFilter("ALL");
          }}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No packages awaiting review
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {statusFilter !== "ALL" || typeFilter !== "ALL" || priorityFilter !== "ALL"
              ? "Zero content packages match your active editorial filter criteria."
              : "All assembled packages have been reviewed and approved for distribution."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setStatusFilter("ALL");
                setTypeFilter("ALL");
                setPriorityFilter("ALL");
                setSubmitterFilter("ALL");
                setItems(INITIAL_REVIEW_ITEMS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Queue
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Header & Simulation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Editorial Review Queue ({filteredItems.length} packages)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Final editorial sign-off, preview, revision instructions, and audit log
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setItems(INITIAL_REVIEW_ITEMS)}
            className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC]"
          >
            ↻ Refresh Queue
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Editorial Review Filters */}
      <ReviewFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        submitterFilter={submitterFilter}
        onSubmitterChange={setSubmitterFilter}
        onReset={() => {
          setStatusFilter("ALL");
          setTypeFilter("ALL");
          setPriorityFilter("ALL");
          setSubmitterFilter("ALL");
        }}
      />

      {/* Bulk Editorial Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#0066CC]/50 bg-[#0066CC]/10 p-3 text-xs">
          <span className="font-semibold text-[#3399FF]">
            {selectedIds.length} package(s) selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleBulkApprove}
              className="rounded bg-[#0D9040] px-3 py-1 font-semibold text-white hover:bg-[#0D9040]/80"
            >
              ✓ Bulk Approve Selected ({selectedIds.length})
            </button>
            <button
              type="button"
              onClick={handleBulkDeadline}
              className="rounded border border-[#2E2E32] bg-[#12121A] px-3 py-1 font-medium text-[#FAFAFA] hover:border-[#0066CC]"
            >
              Set Review Deadline ⏰
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[#CF2020] hover:underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Split view: Left review list (1 col), Right editorial action workspace (3 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left: Queue items */}
        <aside className="space-y-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-4 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Pending Sign-Off ({items.length})
          </h3>
          <div className="space-y-2">
            {items.map((it) => {
              const isSelected = it.packageId === activeItem.packageId;
              return (
                <div
                  key={it.packageId}
                  onClick={() => setActiveItemId(it.packageId)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-[#0066CC] bg-[#0A0A0B] shadow"
                      : "border-[#2E2E32] bg-[#12121A]/80 hover:border-[#2E2E32]/90"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="rounded bg-[#6C5CE7]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#6C5CE7]">
                      {it.packageType}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        it.status === "APPROVED"
                          ? "bg-[#0D9040]/20 text-[#0D9040]"
                          : it.status === "REJECTED"
                          ? "bg-[#CF2020]/20 text-[#CF2020]"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {it.status}
                    </span>
                  </div>
                  <h4 className="line-clamp-2 text-xs font-bold text-[#FAFAFA]">
                    {it.headline}
                  </h4>
                  <div className="mt-2 text-[10px] text-[#A0A4A8]">
                    {it.submittedBy} · {new Date(it.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right: Review Actions Panel */}
        <main className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 lg:col-span-3">
          <ReviewActions
            item={activeItem}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestRevision={handleRequestRevision}
            onAddComment={handleAddComment}
          />
        </main>
      </div>
    </div>
  );
}

interface ReviewFilterBarProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  typeFilter: string;
  onTypeChange: (val: string) => void;
  priorityFilter: string;
  onPriorityChange: (val: string) => void;
  submitterFilter: string;
  onSubmitterChange: (val: string) => void;
  onReset: () => void;
}

function ReviewFilterBar({
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  priorityFilter,
  onPriorityChange,
  submitterFilter,
  onSubmitterChange,
  onReset,
}: ReviewFilterBarProps): React.JSX.Element {
  const isFiltered =
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    submitterFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Dropdown */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REVISION_REQUESTED">REVISION REQUESTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Package Type Dropdown */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Format:</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Formats</option>
            <option value="ARTICLE">ARTICLE</option>
            <option value="SOCIAL_POST">SOCIAL POST</option>
            <option value="VIDEO_SCRIPT">VIDEO SCRIPT</option>
            <option value="MULTI_CHANNEL">MULTI-CHANNEL</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Priorities</option>
            <option value="BREAKING">BREAKING</option>
            <option value="HIGH">HIGH</option>
            <option value="STANDARD">STANDARD</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        {/* Submitter text filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Submitter:</label>
          <select
            value={submitterFilter}
            onChange={(e) => onSubmitterChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Submitters</option>
            <option value="AGT-026">AGT-026 Package Assembly</option>
            <option value="Editor">Senior Editor</option>
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
