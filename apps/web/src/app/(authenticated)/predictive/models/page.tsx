"use client";

import React, { useState, useEffect } from "react";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { callRpc } from "../../../../lib/bff/client";
import { ModelCard } from "../components/model-card";
import { PredictiveModelItem, PredictiveModelStatus } from "../types";

const INITIAL_6_MODELS: PredictiveModelItem[] = [
  {
    id: "pred-001-v2.4",
    name: "Virality MAPE Trajectory Prediction Engine",
    engineCode: "PRED-001",
    version: "2.4.0",
    status: "ACTIVE",
    accuracyScore: 0.958,
    accuracyTrendPct: 1.4,
    dataPointsUsed: 14800,
    minDataRequirementMet: true,
    lastTrainedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "pred-002-v2.1",
    name: "Audience Segment Engagement Forecaster",
    engineCode: "PRED-002",
    version: "2.1.0",
    status: "ACTIVE",
    accuracyScore: 0.941,
    accuracyTrendPct: 0.8,
    dataPointsUsed: 8900,
    minDataRequirementMet: true,
    lastTrainedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "pred-003-v1.9",
    name: "Content Performance & Lift Optimizer",
    engineCode: "PRED-003",
    version: "1.9.0",
    status: "ACTIVE",
    accuracyScore: 0.935,
    accuracyTrendPct: 1.1,
    dataPointsUsed: 6200,
    minDataRequirementMet: true,
    lastTrainedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "pred-004-v1.8",
    name: "5-Stage Trend Lifecycle Transition Predictor",
    engineCode: "PRED-004",
    version: "1.8.0",
    status: "ACTIVE",
    accuracyScore: 0.954,
    accuracyTrendPct: 2.3,
    dataPointsUsed: 19400,
    minDataRequirementMet: true,
    lastTrainedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "pred-005-v2.0",
    name: "Anomaly Detector & False Positive Guard",
    engineCode: "PRED-005",
    version: "2.0.0",
    status: "ACTIVE",
    accuracyScore: 0.988,
    accuracyTrendPct: 0.5,
    dataPointsUsed: 42100,
    minDataRequirementMet: true,
    lastTrainedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "pred-006-v2.0",
    name: "Multi-Platform Optimal Publishing Window Predictor",
    engineCode: "PRED-006",
    version: "2.0.0",
    status: "ACTIVE",
    accuracyScore: 0.962,
    accuracyTrendPct: 1.8,
    dataPointsUsed: 28400,
    minDataRequirementMet: true,
    lastTrainedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "pred-001-v2.5-rc1",
    name: "Virality MAPE Candidate Model (Experimental)",
    engineCode: "PRED-001",
    version: "2.5.0-rc1",
    status: "CANDIDATE",
    accuracyScore: 0.966,
    accuracyTrendPct: 2.1,
    dataPointsUsed: 420,
    minDataRequirementMet: true,
    lastTrainedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "pred-002-v2.2-draft",
    name: "Audience Engagement New Segment Model",
    engineCode: "PRED-002",
    version: "2.2.0-alpha",
    status: "TRAINING",
    accuracyScore: 0.885,
    accuracyTrendPct: -0.4,
    dataPointsUsed: 85,
    minDataRequirementMet: false, // < 100 points
    lastTrainedAt: new Date().toISOString(),
  },
];

export default function PredictiveModelManagementPage(): React.JSX.Element {
  const [models, setModels] = useState<PredictiveModelItem[]>(INITIAL_6_MODELS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [engineFilter, setEngineFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [simulateMode, setSimulateMode] = useState<
    "normal" | "loading" | "empty" | "error"
  >("normal");

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
          setError(
            resp.error?.message ||
              "Failed to load predictive models from BFF.",
          );
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Network error contacting BFF.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModels();
  }, []);

  const handlePromote = (modelId: string) => {
    setModels(
      models.map((m) => {
        if (m.id !== modelId) return m;
        return { ...m, status: "ACTIVE" as PredictiveModelStatus };
      }),
    );
    alert(`Model ${modelId} promoted to ACTIVE status!`);
  };

  const handleRetire = (modelId: string) => {
    setModels(
      models.map((m) => {
        if (m.id !== modelId) return m;
        return { ...m, status: "RETIRED" as PredictiveModelStatus };
      }),
    );
    alert(`Model ${modelId} marked as RETIRED.`);
  };

  const filteredModels = models.filter((m) => {
    if (statusFilter !== "ALL" && m.status !== statusFilter) {
      return false;
    }
    if (engineFilter !== "ALL" && m.engineCode !== engineFilter) {
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-[#12121A]" />
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
          <h2 className="text-lg font-bold text-[#FAFAFA]">Model Management</h2>
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
            Model Registry Retrieval Failed
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
              PRED-001–006 Predictive Intelligence Model Management
            </h2>
            <p className="text-xs text-[#A0A4A8]">
              Authoritative model versioning, accuracy calibration ledgers, and promote/retire governance
            </p>
          </div>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>

        {/* Filter bar visible */}
        <ModelFilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          engineFilter={engineFilter}
          onEngineChange={setEngineFilter}
          onReset={() => {
            setStatusFilter("ALL");
            setEngineFilter("ALL");
          }}
        />

        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-[#2E2E32] bg-[#12121A] p-8 text-center">
          <img
            src={AuthoritativeBrandIdentity.assets.mark}
            alt="Brand Mark"
            className="mx-auto mb-4 h-12 w-12 object-contain"
          />
          <h3 className="mb-2 text-lg font-bold text-[#FAFAFA]">
            No predictive models match your filter criteria
          </h3>
          <p className="mb-6 max-w-sm text-xs text-[#A0A4A8]">
            {statusFilter !== "ALL" || engineFilter !== "ALL"
              ? "Zero models match your selected status or engine code filter."
              : "Zero predictive models are currently active in the registry."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (simulateMode === "empty") setSimulateMode("normal");
              else {
                setStatusFilter("ALL");
                setEngineFilter("ALL");
                setModels(INITIAL_6_MODELS);
              }
            }}
            className="rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-semibold text-[#FAFAFA] hover:bg-[#3399FF]"
          >
            Reset Filters &amp; Load Registry
          </button>
        </div>
      </div>
    );
  }

  // 4. DATA STATE
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2E2E32] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            Predictive Model Management ({filteredModels.length} models)
          </h2>
          <p className="text-xs text-[#A0A4A8]">
            Authoritative lifecycle management for Virality, Engagement, Optimizer, Trend, Anomaly, and Publishing engines
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() =>
              alert("New candidate model registration modal (scheduled for downstream model training upload)")
            }
            className="rounded-md bg-[#0066CC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3399FF] shadow"
          >
            + Register Candidate Model
          </button>
          <SimulationToolbar currentMode={simulateMode} onSelectMode={setSimulateMode} />
        </div>
      </div>

      {/* Filter Bar */}
      <ModelFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        engineFilter={engineFilter}
        onEngineChange={setEngineFilter}
        onReset={() => {
          setStatusFilter("ALL");
          setEngineFilter("ALL");
        }}
      />

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredModels.map((mod) => (
          <ModelCard
            key={mod.id}
            model={mod}
            onPromote={handlePromote}
            onRetire={handleRetire}
          />
        ))}
      </div>
    </div>
  );
}

interface ModelFilterBarProps {
  statusFilter: string;
  onStatusChange: (val: string) => void;
  engineFilter: string;
  onEngineChange: (val: string) => void;
  onReset: () => void;
}

function ModelFilterBar({
  statusFilter,
  onStatusChange,
  engineFilter,
  onEngineChange,
  onReset,
}: ModelFilterBarProps): React.JSX.Element {
  const isFiltered = statusFilter !== "ALL" || engineFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2E2E32] bg-[#12121A] p-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Engine Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Engine:</label>
          <select
            value={engineFilter}
            onChange={(e) => onEngineChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Engines (PRED-001–006)</option>
            <option value="PRED-001">PRED-001 Virality</option>
            <option value="PRED-002">PRED-002 Engagement</option>
            <option value="PRED-003">PRED-003 Optimizer</option>
            <option value="PRED-004">PRED-004 Trend Lifecycle</option>
            <option value="PRED-005">PRED-005 Anomaly Detector</option>
            <option value="PRED-006">PRED-006 Publishing Time</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[#A0A4A8]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded border border-[#2E2E32] bg-[#0A0A0B] px-2 py-1 text-xs text-[#FAFAFA] focus:border-[#0066CC]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CANDIDATE">CANDIDATE</option>
            <option value="TRAINING">TRAINING</option>
            <option value="RETIRED">RETIRED</option>
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
