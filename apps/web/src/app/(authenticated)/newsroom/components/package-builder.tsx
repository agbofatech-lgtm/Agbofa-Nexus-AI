"use client";

import React, { useState } from "react";
import {
  PackageItem,
  PackageType,
  PackageAsset,
  AssetStatus,
} from "../types";

export interface PackageBuilderProps {
  pkg: PackageItem;
  onChangePackageType: (type: PackageType) => void;
  onGenerateMissing: () => void;
  onEditAsset: (assetId: string) => void;
  onSubmitForReview: () => void;
  onSaveDraft: () => void;
}

const PACKAGE_TYPES: Array<{ id: PackageType; label: string; icon: string }> = [
  { id: "ARTICLE", label: "Article Package", icon: "📰" },
  { id: "SOCIAL_POST", label: "Social Post", icon: "💬" },
  { id: "VIDEO_SCRIPT", label: "Video Script", icon: "🎬" },
  { id: "AUDIO_TRANSCRIPT", label: "Audio Transcript", icon: "🎙" },
  { id: "INFOGRAPHIC_SPEC", label: "Infographic Spec", icon: "📊" },
  { id: "MULTI_CHANNEL", label: "Multi-Channel Bundle", icon: "🌐" },
];

function getAssetStatusStyle(status: AssetStatus): string {
  switch (status) {
    case "PRESENT":
      return "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40";
    case "GENERATING":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse";
    case "MISSING":
    default:
      return "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40";
  }
}

export function PackageBuilder({
  pkg,
  onChangePackageType,
  onGenerateMissing,
  onEditAsset,
  onSubmitForReview,
  onSaveDraft,
}: PackageBuilderProps): React.JSX.Element {
  const [activeAssetId, setActiveAssetId] = useState<string | null>(
    pkg.assets.length > 0 ? pkg.assets[0].assetId : null,
  );

  const missingCount = pkg.assets.filter((a) => a.status === "MISSING").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#2E2E32] pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Content Factory Package Assembly ({pkg.packageId})
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative multi-format packaging engine with AGT-028 compliance &amp; brand voice
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGenerateMissing}
            disabled={missingCount === 0}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              missingCount > 0
                ? "bg-[#6C5CE7] text-white hover:bg-[#6C5CE7]/80"
                : "bg-[#2E2E32] text-[#A0A4A8] cursor-not-allowed"
            }`}
          >
            ⚡ Generate Missing Assets ({missingCount})
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-md border border-[#2E2E32] bg-[#12121A] px-3.5 py-1.5 text-xs font-medium text-[#FAFAFA] hover:border-[#0066CC] transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={onSubmitForReview}
            className="rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF] transition-colors"
          >
            Submit for Editorial Review →
          </button>
        </div>
      </div>

      {/* Package Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#A0A4A8]">
          Package Format Selection:
        </label>
        <div className="flex flex-wrap gap-2">
          {PACKAGE_TYPES.map((pt) => {
            const isSelected = pkg.packageType === pt.id;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => onChangePackageType(pt.id)}
                className={`flex items-center space-x-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-[#0066CC] text-white font-semibold shadow"
                    : "border border-[#2E2E32] bg-[#12121A] text-[#A0A4A8] hover:border-[#0066CC] hover:text-[#FAFAFA]"
                }`}
              >
                <span>{pt.icon}</span>
                <span>{pt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Voice Compatibility & Quality Checks Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Brand Voice Compatibility Score Card */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A0A4A8]">
              Brand Voice Compatibility
            </span>
            <span className="rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              {(pkg.brandVoiceScore.compatibilityScore * 100).toFixed(0)}% Match
            </span>
          </div>
          <div className="mb-2 space-y-1">
            <div className="text-xs font-medium text-[#FAFAFA]">Tone Analysis:</div>
            <div className="flex flex-wrap gap-1">
              {pkg.brandVoiceScore.toneAnalysis.map((tone, i) => (
                <span
                  key={i}
                  className="rounded bg-[#0A0A0B] px-2 py-0.5 text-[11px] text-[#3399FF] border border-[#2E2E32]"
                >
                  {tone}
                </span>
              ))}
            </div>
          </div>
          {pkg.brandVoiceScore.mismatchWarnings.length > 0 && (
            <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-400">
              <div className="font-bold">⚠ Tone Recommendation:</div>
              <ul className="mt-1 list-inside list-disc text-[11px]">
                {pkg.brandVoiceScore.mismatchWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Quality Checks Card */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-4">
          <div className="mb-2 text-xs font-semibold text-[#A0A4A8]">
            Mandatory AGT-028 &amp; Editorial Quality Checks
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between rounded bg-[#0A0A0B] p-2">
              <span className="text-[#FAFAFA]">Factual Consistency Verified</span>
              <span
                className={`font-bold ${
                  pkg.factualConsistencyVerified ? "text-[#0D9040]" : "text-[#CF2020]"
                }`}
              >
                {pkg.factualConsistencyVerified ? "✔ PASSED" : "✕ FAILED"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-[#0A0A0B] p-2">
              <span className="text-[#FAFAFA]">AGT-028 Compliance Pre-Check</span>
              <span
                className={`font-bold ${
                  pkg.compliancePreCheckPassed ? "text-[#0D9040]" : "text-[#CF2020]"
                }`}
              >
                {pkg.compliancePreCheckPassed ? "✔ PASSED" : "✕ FAILED"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-[#0A0A0B] p-2">
              <span className="text-[#FAFAFA]">Source Attribution Completeness</span>
              <span
                className={`font-bold ${
                  pkg.sourceAttributionComplete ? "text-[#0D9040]" : "text-[#CF2020]"
                }`}
              >
                {pkg.sourceAttributionComplete ? "✔ COMPLETE" : "✕ INCOMPLETE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Required Assets Checklist & Editor Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left list: Required assets checklist */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A4A8]">
            Required Assets ({pkg.assets.length} items)
          </h3>
          <div className="space-y-2">
            {pkg.assets.map((asset) => {
              const isSelected = activeAssetId === asset.assetId;
              return (
                <div
                  key={asset.assetId}
                  onClick={() => setActiveAssetId(asset.assetId)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-[#0066CC] bg-[#12121A] shadow"
                      : "border-[#2E2E32] bg-[#12121A]/60 hover:border-[#2E2E32]/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FAFAFA]">
                      {asset.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getAssetStatusStyle(
                        asset.status,
                      )}`}
                    >
                      {asset.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#A0A4A8]">
                    <span>Type: {asset.type}</span>
                    <span>{asset.required ? "Required" : "Optional"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right preview/editor: Selected asset details */}
        <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 lg:col-span-2">
          {activeAssetId ? (
            (() => {
              const asset = pkg.assets.find((a) => a.assetId === activeAssetId);
              if (!asset) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#2E2E32] pb-3">
                    <div>
                      <h4 className="text-base font-bold text-[#FAFAFA]">
                        {asset.title}
                      </h4>
                      <p className="text-xs text-[#A0A4A8]">
                        Asset ID: {asset.assetId} · Format: {asset.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditAsset(asset.assetId)}
                      className="rounded bg-[#0066CC] px-3 py-1.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
                    >
                      ✎ Edit Asset Content
                    </button>
                  </div>
                  <div className="min-h-[220px] rounded border border-[#2E2E32] bg-[#0A0A0B] p-4 font-mono text-xs leading-relaxed text-[#FAFAFA] whitespace-pre-wrap">
                    {asset.content || "(No asset content generated yet. Click 'Generate Missing Assets' above.)"}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-xs text-[#A0A4A8]">
              Select an asset from the checklist to preview or edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackageBuilder;
