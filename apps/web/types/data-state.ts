export type DataSource =
  "live" | "mock" | "estimated" | "manual" | "external" | "unavailable";
export type DataAuthorityState =
  | "live"
  | "demo"
  | "unavailable"
  | "not_verified"
  | "error"
  | "loading"
  | "empty";

export type DataAvailability =
  "available" | "pending" | "degraded" | "unavailable";
export interface DataConfidence {
  score: number;
  basis: string;
  kind: "evidence" | "model" | "estimate" | "manual";
}
export interface DataProvenance {
  kind: DataSource;
  dataSource: DataSource;
  label: string;
  source: string;
  detail: string;
  updatedAt: Date | null;
  availability: DataAvailability;
}
export interface DataState<T> {
  data: T | null;
  state: DataAuthorityState;
  source: string;
  lastUpdated: Date | null;
  error: string | null;
  isDemo: boolean;
  observedAt: Date | null;
  confidence: DataConfidence | null;
  provenance: DataProvenance;
}
export function createDataProvenance(
  kind: DataSource,
  source: string,
  detail: string,
  updatedAt: Date | null = null,
): DataProvenance {
  const labels: Record<DataSource, string> = {
    live: "Live source",
    mock: "Development dataset",
    estimated: "Estimated data",
    manual: "Manual source",
    external: "External source",
    unavailable: "Not connected",
  };
  return {
    kind,
    dataSource: kind,
    label: labels[kind],
    source,
    detail,
    updatedAt,
    availability: kind === "unavailable" ? "unavailable" : "available",
  };
}
export function demoDataState<T>(data: T, source: string): DataState<T> {
  const detail =
    "Deterministic frontend fixture. It is not production telemetry or operational authority.";
  return {
    data,
    state: "demo",
    source,
    lastUpdated: null,
    error: null,
    isDemo: true,
    observedAt: null,
    confidence: null,
    provenance: createDataProvenance("mock", source, detail),
  };
}
export function loadingDataState<T>(source: string): DataState<T> {
  return {
    data: null,
    state: "loading",
    source,
    lastUpdated: null,
    error: null,
    isDemo: false,
    observedAt: null,
    confidence: null,
    provenance: createDataProvenance(
      "unavailable",
      source,
      "Waiting for the selected frontend adapter.",
    ),
  };
}
export function unavailableDataState<T>(source: string): DataState<T> {
  return {
    data: null,
    state: "unavailable",
    source,
    lastUpdated: null,
    error: null,
    isDemo: false,
    observedAt: null,
    confidence: null,
    provenance: createDataProvenance(
      "unavailable",
      source,
      "No authoritative integration is available in this frontend environment.",
    ),
  };
}
