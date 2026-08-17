"use client";

import React, { useRef, useEffect } from "react";
import { MonitorSignal, SignalType, SignalPriority } from "../types";

export interface SignalStreamProps {
  signals: MonitorSignal[];
  isLoading: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSignalClick: (signal: MonitorSignal) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
}

function getSignalTypeBadge(st: SignalType): { label: string; style: string } {
  switch (st) {
    case "BREAKING":
      return {
        label: "BREAKING",
        style: "bg-[#CF2020]/20 text-[#CF2020] border border-[#CF2020]/40 font-bold",
      };
    case "TREND":
      return {
        label: "TREND",
        style: "bg-[#0066CC]/20 text-[#3399FF] border border-[#0066CC]/40 font-semibold",
      };
    case "SENTIMENT":
      return {
        label: "SENTIMENT",
        style: "bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/40 font-semibold",
      };
    case "ENGAGEMENT":
    default:
      return {
        label: "ENGAGEMENT",
        style: "bg-[#0D9040]/20 text-[#0D9040] border border-[#0D9040]/40",
      };
  }
}

function getPriorityBadge(pri: SignalPriority): { label: string; style: string } {
  switch (pri) {
    case "C1":
      return {
        label: "C1 — CRITICAL",
        style: "bg-[#CF2020] text-white font-bold",
      };
    case "C2":
      return {
        label: "C2 — HIGH",
        style: "bg-amber-500 text-black font-bold",
      };
    case "C3":
    default:
      return {
        label: "C3 — STANDARD",
        style: "bg-[#2E2E32] text-[#FAFAFA]",
      };
  }
}

export function SignalStream({
  signals,
  isLoading,
  isPaused,
  onPause,
  onResume,
  onSignalClick,
  selectedType,
  onSelectType,
}: SignalStreamProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [signals, isPaused]);

  const filteredSignals = signals.filter((s) => {
    if (selectedType !== "ALL" && s.signalType !== selectedType) {
      return false;
    }
    return true;
  });

  return (
    <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5 shadow">
      {/* Top Header: Title, Pause/Resume Stream CTA, and Type Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E2E32] pb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-bold text-[#FAFAFA]">
            Real-Time Ingested Signal Stream ({filteredSignals.length} items)
          </h3>
          {isPaused ? (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              ⏸ STREAM PAUSED
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-[#0D9040]/20 px-2 py-0.5 text-[10px] font-bold text-[#0D9040]">
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              ● STREAM LIVE
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Signal Type Filters */}
          <div className="flex items-center space-x-1">
            <span className="text-[#A0A4A8]">Filter:</span>
            {(["ALL", "BREAKING", "TREND", "SENTIMENT", "ENGAGEMENT"] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelectType(type)}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                    selectedType === type
                      ? "bg-[#0066CC] text-white"
                      : "bg-[#0A0A0B] text-[#A0A4A8] hover:text-[#FAFAFA]"
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            className={`rounded-md px-3 py-1 font-semibold transition-colors ${
              isPaused
                ? "bg-[#0D9040] text-white hover:bg-[#0D9040]/80"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            {isPaused ? "▶ Resume Stream" : "⏸ Pause Stream"}
          </button>
        </div>
      </div>

      {/* Scrolling Signal Feed */}
      <div
        className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1"
        role="log"
        aria-label="Real-time signal stream"
      >
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#A0A4A8]">
            Loading signal stream telemetry...
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A0A4A8]">
            Zero detected signals match your selected type filter.
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const typeBadge = getSignalTypeBadge(sig.signalType);
            const priBadge = getPriorityBadge(sig.priority);
            return (
              <div
                key={sig.signalId}
                onClick={() => onSignalClick(sig)}
                className="group cursor-pointer rounded border border-[#2E2E32] bg-[#0A0A0B] p-3 transition-colors hover:border-[#0066CC]"
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-[#12121A] px-2 py-0.5 font-mono text-xs font-bold text-[#3399FF] border border-[#2E2E32]">
                      {sig.platform}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${typeBadge.style}`}
                    >
                      {typeBadge.label}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${priBadge.style}`}
                    >
                      {priBadge.label}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#A0A4A8]">
                    {new Date(sig.detectedAt).toLocaleTimeString()}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs font-medium text-[#FAFAFA] group-hover:text-[#3399FF]">
                  {sig.contentPreview}
                </p>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#A0A4A8]">
                  <span>Type: {sig.contentType}</span>
                  <span className="font-mono">ID: {sig.signalId}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default SignalStream;
