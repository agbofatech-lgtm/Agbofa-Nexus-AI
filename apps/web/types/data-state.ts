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
export interface DataProvenance {
  kind: DataSource;
  label: string;
  source: string;
  detail: string;
  updatedAt: Date | null;
}
export interface DataState<T> {
  data: T | null;
  state: DataAuthorityState;
  source: string;
  lastUpdated: Date | null;
  error: string | null;
  isDemo: boolean;
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
  return { kind, label: labels[kind], source, detail, updatedAt };
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
    provenance: createDataProvenance(
      "unavailable",
      source,
      "No authoritative integration is available in this frontend environment.",
    ),
  };
}
