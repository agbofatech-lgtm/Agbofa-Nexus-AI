"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { MediaViewer } from "../components/media-viewer";
import { ObjectDetectionList } from "../components/object-detection-list";
import { SAMPLE_IMAGE_ANALYSIS } from "../mock-data";
import { ImageAnalysisItem, DetectedObjectItem } from "../types";

export default function MultimodalImageAnalysisPage(): React.JSX.Element {
  const [analysis, setAnalysis] = useState<ImageAnalysisItem>(SAMPLE_IMAGE_ANALYSIS);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

  useEffect(() => {
    async function fetchImageAnalysis() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await callRpc<
          { tenant_id: string; media_type: string },
          { status?: string }
        >("runtime.v1.AIGatewayService", "InvokeModel", {
          tenant_id: "tenant-default",
          media_type: "IMAGE",
        });
        if (resp.status === "ERROR") {
          setError("Failed to retrieve image analysis ledger from BFF proxy.");
        }
      } catch {
        // Fallback to sample image analysis
      } finally {
        setIsLoading(false);
      }
    }
    fetchImageAnalysis();
  }, []);

  const handleSelectObject = (obj: DetectedObjectItem) => {
    if (selectedObjectId === obj.id) {
      setSelectedObjectId(null);
    } else {
      setSelectedObjectId(obj.id);
    }
  };

  // 1. LOADING STATE
  if (simulateMode === "loading" || (isLoading && simulateMode === "normal")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-[#12121A]" />
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="h-96 w-full animate-pulse rounded-lg bg-[#12121A]" />
      </div>
    );
  }

  // 2. ERROR STATE
  if (simulateMode === "error" || error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Image Analysis & OCR Extraction (AGT-013)
          </h2>
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
            Image Analysis Retrieval Failed
          </h3>
          <p className="mb-4 text-xs text-[#A0A4A8]">
            {error ||
              "Simulated error: unable to load GPT-4V vision analysis via BFF proxy."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "error") setSimulateMode("normal");
              else window.location.reload();
            }}
            className="rounded-md bg-[#CF2020] px-4 py-2 text-xs font-semibold text-[#FAFAFA]"
          >
            Retry Retrieval
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (simulateMode === "empty") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Image Analysis & OCR Extraction (AGT-013)
          </h2>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            Zero image analyses recorded today
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            No image assets have been submitted to AGT-013 for OCR extraction or object detection in this window.
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else setAnalysis(SAMPLE_IMAGE_ANALYSIS);
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Load Sample Image Analysis
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-8">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            Image Analysis, OCR & Bounding Box Detections (AGT-013 / GPT-4V)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative optical character recognition, object bounding box coordinates, and visual sentiment classification
          </p>
        </div>

        <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
      </div>

      {/* Main Media Viewer Component */}
      <MediaViewer
        analysis={analysis}
        onSelectObject={handleSelectObject}
        selectedObjectId={selectedObjectId}
      />

      {/* Object Detection List Component */}
      <ObjectDetectionList
        objects={analysis.detectedObjects}
        selectedObjectId={selectedObjectId}
        onSelectObject={handleSelectObject}
      />

      {/* Thumbnail Gallery Grid of Recent Image Analyses */}
      <div className="rounded-lg border border-[#2E2E32] bg-[#12121A] p-5">
        <h3 className="mb-2 text-sm font-bold text-[#FAFAFA]">
          Recent Image Analysis Ledger (3-4 Columns Gallery)
        </h3>
        <p className="mb-4 text-xs text-[#A0A4A8]">
          Click any thumbnail to inspect its full OCR text, bounding box coordinates, and AI vision description
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {(
            [
              {
                id: "thumb-1",
                title: "Operations Room Photograph",
                url: analysis.mediaUrl,
                ocr: "AGBOFA NEXUS AI 100% HEALTHY",
                conf: "98%",
              },
              {
                id: "thumb-2",
                title: "Verification Ledger Screen",
                url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
                ocr: "MAPE ACCURACY CALIBRATION",
                conf: "95%",
              },
              {
                id: "thumb-3",
                title: "Global Press Conference Desk",
                url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80",
                ocr: "EDITORIAL INDEPENDENCE POLICY",
                conf: "97%",
              },
              {
                id: "thumb-4",
                title: "RLS Architecture Schema Diagram",
                url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80",
                ocr: "app.current_tenant ENFORCEMENT",
                conf: "99%",
              },
            ] as const
          ).map((t) => (
            <div
              key={t.id}
              onClick={() => alert(`Previewing image asset: "${t.title}". OCR: "${t.ocr}" (${t.conf} Confidence).`)}
              className="group cursor-pointer overflow-hidden rounded-lg border border-[#2E2E32] bg-[#0A0A0B] transition-colors hover:border-[#0066CC]"
            >
              <div className="relative aspect-video w-full bg-[#12121A]">
                <img
                  src={t.url}
                  alt={t.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0D9040]">
                  {t.conf}
                </span>
              </div>
              <div className="p-2.5">
                <h4 className="text-xs font-bold text-[#FAFAFA] group-hover:text-[#3399FF]">
                  {t.title}
                </h4>
                <p className="mt-0.5 truncate font-mono text-[10px] text-[#A0A4A8]">
                  {t.ocr}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
