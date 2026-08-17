import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { Claim, ClaimStatus, TruthLoadingState } from "@/types/truth";

interface TruthState {
  claims: Claim[];
  selectedClaimId: string | null;
  statusFilter: ClaimStatus | "all";
  loading: TruthLoadingState;
  error: string | null;
  setClaims: (claims: Claim[]) => void;
  setSelectedClaimId: (id: string | null) => void;
  setStatusFilter: (status: ClaimStatus | "all") => void;
  setLoading: (key: keyof TruthLoadingState, value: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTruthStore = create<TruthState>()(
  devtools(
    (set) => ({
      claims: [],
      selectedClaimId: null,
      statusFilter: "all",
      loading: { claims: true, detail: false },
      error: null,
      setClaims: (claims) =>
        set(
          (state) => ({
            claims,
            selectedClaimId: state.selectedClaimId ?? claims[0]?.id ?? null,
          }),
          false,
          "truth/setClaims",
        ),
      setSelectedClaimId: (selectedClaimId) =>
        set({ selectedClaimId }, false, "truth/setSelectedClaim"),
      setStatusFilter: (statusFilter) =>
        set({ statusFilter }, false, "truth/setStatusFilter"),
      setLoading: (key, value) =>
        set(
          (state) => ({ loading: { ...state.loading, [key]: value } }),
          false,
          `truth/loading/${key}`,
        ),
      setError: (error) => set({ error }, false, "truth/setError"),
    }),
    {
      name: "AgbofaTruthStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
