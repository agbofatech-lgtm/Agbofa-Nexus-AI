export type DataAuthorityState =
  | "live"
  | "demo"
  | "unavailable"
  | "not_verified"
  | "error"
  | "loading"
  | "empty";

export interface DataState<T> {
  data: T | null;
  state: DataAuthorityState;
  source: string;
  lastUpdated: Date | null;
  error: string | null;
  isDemo: boolean;
}

export function demoDataState<T>(data: T, source: string): DataState<T> {
  return {
    data,
    state: "demo",
    source,
    lastUpdated: null,
    error: null,
    isDemo: true,
  };
}
