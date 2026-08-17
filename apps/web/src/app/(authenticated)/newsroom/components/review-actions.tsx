"use client";

import React, { useState } from "react";
import { ReviewItem, ReviewStatus } from "../types";

export interface ReviewActionsProps {
  item: ReviewItem;
  onApprove: (item: ReviewItem, notes: string) => void;
  onReject: (item: ReviewItem, reason: string) => void;
  onRequestRevision: (item: ReviewItem, requests: string) => void;
  onAddComment: (item: ReviewItem, commentText: string) => void;
}

function getDecisionBadge(decision: ReviewStatus): string {
  switch (decision) {
    case "APPROVED":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40";
    case "REJECTED":
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40";
    case "REVISION_REQUESTED":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
    case "PENDING":
    default:
      return "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40";
  }
}

export function ReviewActions({
  item,
  onApprove,
  onReject,
  onRequestRevision,
  onAddComment,
}: ReviewActionsProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"preview" | "comments" | "history">("preview");
  const [notesInput, setNotesInput] = useState<string>("");
  const [commentInput, setCommentInput] = useState<string>("");
  const [showModal, setShowModal] = useState<"approve" | "reject" | "revision" | null>(null);

  const handleConfirmDecision = () => {
    if (showModal === "approve") {
      onApprove(item, notesInput);
    } else if (showModal === "reject") {
      onReject(item, notesInput);
    } else if (showModal === "revision") {
      onRequestRevision(item, notesInput);
    }
    setShowModal(null);
    setNotesInput("");
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(item, commentInput.trim());
    setCommentInput("");
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Primary Action CTAs */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#2E2E32] pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded bg-[#6C5CE7]/10 px-2.5 py-0.5 text-xs font-semibold text-[#6C5CE7] border border-[#6C5CE7]/30">
              {item.packageType}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getDecisionBadge(
                item.status,
              )}`}
            >
              Current Status: {item.status}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-[#FAFAFA]">
            {item.headline} ({item.packageId})
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Submitted by <span className="font-semibold text-[#FAFAFA]">{item.submittedBy}</span> ·{" "}
            {new Date(item.submittedAt).toLocaleString()}
          </p>
        </div>

        {/* Editorial Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal("approve")}
            className="rounded-md bg-[#0D9040] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#0D9040]/80 transition-colors"
          >
            ✓ Approve (Route to Distribution)
          </button>
          <button
            type="button"
            onClick={() => setShowModal("revision")}
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            ✎ Request Revision
          </button>
          <button
            type="button"
            onClick={() => setShowModal("reject")}
            className="rounded-md border border-[#CF2020]/40 bg-[#CF2020]/10 px-3.5 py-2 text-xs font-semibold text-[#CF2020] hover:bg-[#CF2020]/20 transition-colors"
          >
            ✕ Reject Package
          </button>
        </div>
      </div>

      {/* Internal Workspace Tabs: Preview | Comments | Review History */}
      <div className="border-b border-[#2E2E32]">
        <nav className="flex space-x-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`pb-2.5 transition-colors ${
              activeTab === "preview"
                ? "border-b-2 border-[#0066CC] text-[#FAFAFA]"
                : "text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            📰 Package Preview &amp; Assets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`pb-2.5 transition-colors ${
              activeTab === "comments"
                ? "border-b-2 border-[#0066CC] text-[#FAFAFA]"
                : "text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            💬 Editorial Comments ({item.comments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-[#0066CC] text-[#FAFAFA]"
                : "text-[#A0A4A8] hover:text-[#FAFAFA]"
            }`}
          >
            📜 Audit Review History ({item.history.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: Full Package Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
              Primary Package Content (Type: {item.packageType})
            </h3>
            {item.packageDetail && item.packageDetail.assets.length > 0 ? (
              <div className="space-y-4">
                {item.packageDetail.assets.map((asset) => (
                  <div
                    key={asset.assetId}
                    className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between border-b border-[#2E2E32] pb-2">
                      <span className="text-xs font-bold text-[#3399FF]">
                        {asset.title} ({asset.type})
                      </span>
                      <span className="rounded bg-[#12121A] px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
                        {asset.status}
                      </span>
                    </div>
                    <div className="font-mono text-xs leading-relaxed text-[#FAFAFA] whitespace-pre-wrap">
                      {asset.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-[#2E2E32] bg-[#0A0A0B] p-4 text-xs text-[#FAFAFA]">
                <p className="font-bold">{item.headline}</p>
                <p className="mt-2 text-[#A0A4A8]">
                  Verified media content package assembled by ContentFactoryService.
                  Factual consistency and AGT-028 compliance pre-check complete.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Threaded Editorial Comments */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add an editorial review note or revision request instruction..."
              className="flex-1 rounded-md border border-[#2E2E32] bg-[#12121A] px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
            >
              Post Note
            </button>
          </form>

          <div className="space-y-2">
            {item.comments.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#A0A4A8]">
                No editorial comments recorded for this package yet.
              </p>
            ) : (
              item.comments.map((comment) => (
                <div
                  key={comment.commentId}
                  className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-3.5 text-xs"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold text-[#3399FF]">
                      {comment.author}
                    </span>
                    <span className="text-[11px] text-[#A0A4A8]">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#FAFAFA]">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Review Audit History */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {item.history.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#A0A4A8]">
              Zero historical review actions logged.
            </p>
          ) : (
            <div className="divide-y divide-[#2E2E32] rounded-lg border border-[#2E2E32] bg-[#12121A]">
              {item.history.map((hist) => (
                <div
                  key={hist.historyId}
                  className="flex flex-col justify-between gap-2 p-4 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-bold text-[#FAFAFA]">
                      {hist.reviewer}
                    </span>{" "}
                    <span className="text-[#A0A4A8]">made decision</span>{" "}
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getDecisionBadge(
                        hist.decision,
                      )}`}
                    >
                      {hist.decision}
                    </span>
                    <p className="mt-1 text-[#A0A4A8]">
                      Reason/Note: &ldquo;{hist.reason}&rdquo;
                    </p>
                  </div>
                  <span className="text-[11px] text-[#A0A4A8]">
                    {new Date(hist.decidedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editorial Decision Confirmation Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-[#2E2E32] bg-[#12121A] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-bold text-[#FAFAFA]">
              {showModal === "approve"
                ? "Confirm Editorial Approval"
                : showModal === "reject"
                ? "Confirm Package Rejection"
                : "Request Editorial Revision"}
            </h3>
            <p className="mb-4 text-xs text-[#A0A4A8]">
              {showModal === "approve"
                ? "Approving this package triggers multi-platform publication via DistributionScheduler."
                : showModal === "reject"
                ? "Rejecting this package returns it to ContentFactoryService with a mandatory reason."
                : "Enter clear revision instructions for ContentFactoryService to rebuild the package."}
            </p>
            <textarea
              rows={3}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Enter editorial notes or instructions..."
              className="mb-4 w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] p-2.5 text-xs text-[#FAFAFA] placeholder-[#A0A4A8] focus:border-[#0066CC] focus:outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className={`rounded px-4 py-1.5 text-xs font-semibold text-white ${
                  showModal === "approve"
                    ? "bg-[#0D9040] hover:bg-[#0D9040]/80"
                    : showModal === "reject"
                    ? "bg-[#CF2020] hover:bg-[#CF2020]/80"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {showModal === "approve"
                  ? "✓ Confirm Approval"
                  : showModal === "reject"
                  ? "✕ Confirm Rejection"
                  : "✎ Submit Revision Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewActions;
