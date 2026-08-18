import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { AIControlData } from "@/types/ai-control";
import type {
  MediaAnalysis,
  MediaUploadState,
  MultimodalWorkspaceData,
} from "@/types/multimodal";
import type {
  PersonalizationControlSettings,
  PersonalizationIntelligenceData,
} from "@/types/personalization-intelligence";
import type { PredictiveIntelligenceData } from "@/types/predictive";

type IntelligenceModule =
  "predictive" | "personalization" | "multimodal" | "aiControl";

interface IntelligenceState {
  predictive: PredictiveIntelligenceData | null;
  personalization: PersonalizationIntelligenceData | null;
  multimodal: MultimodalWorkspaceData | null;
  aiControl: AIControlData | null;
  mediaAnalysis: MediaAnalysis | null;
  upload: MediaUploadState;
  settings: PersonalizationControlSettings;
  selectedProvider: string;
  selectedModel: string;
  loading: Record<IntelligenceModule, boolean>;
  errors: Record<IntelligenceModule, string | null>;
  setModuleData: (
    module: IntelligenceModule,
    data:
      | PredictiveIntelligenceData
      | PersonalizationIntelligenceData
      | MultimodalWorkspaceData
      | AIControlData,
  ) => void;
  setLoading: (module: IntelligenceModule, loading: boolean) => void;
  setError: (module: IntelligenceModule, error: string | null) => void;
  setUpload: (upload: Partial<MediaUploadState>) => void;
  setMediaAnalysis: (analysis: MediaAnalysis | null) => void;
  setSettings: (settings: Partial<PersonalizationControlSettings>) => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
}

const initialUpload: MediaUploadState = {
  status: "idle",
  progress: 0,
  fileName: null,
  mediaKind: null,
  error: null,
};

export const useIntelligenceStore = create<IntelligenceState>()(
  devtools(
    (set) => ({
      predictive: null,
      personalization: null,
      multimodal: null,
      aiControl: null,
      mediaAnalysis: null,
      upload: { ...initialUpload },
      settings: {
        sensitivity: 72,
        diversity: 64,
        personalizationLevel: 82,
        topicWeighting: 76,
      },
      selectedProvider: "gemini",
      selectedModel: "gemini-pro-demo",
      loading: {
        predictive: true,
        personalization: true,
        multimodal: true,
        aiControl: true,
      },
      errors: {
        predictive: null,
        personalization: null,
        multimodal: null,
        aiControl: null,
      },
      setModuleData: (module, data) =>
        set(
          { [module]: data } as Partial<IntelligenceState>,
          false,
          `intelligence/data/${module}`,
        ),
      setLoading: (module, loading) =>
        set(
          (state) => ({ loading: { ...state.loading, [module]: loading } }),
          false,
          `intelligence/loading/${module}`,
        ),
      setError: (module, error) =>
        set(
          (state) => ({ errors: { ...state.errors, [module]: error } }),
          false,
          `intelligence/error/${module}`,
        ),
      setUpload: (upload) =>
        set(
          (state) => ({ upload: { ...state.upload, ...upload } }),
          false,
          "intelligence/upload",
        ),
      setMediaAnalysis: (mediaAnalysis) =>
        set({ mediaAnalysis }, false, "intelligence/mediaAnalysis"),
      setSettings: (settings) =>
        set(
          (state) => ({ settings: { ...state.settings, ...settings } }),
          false,
          "intelligence/settings",
        ),
      setSelectedProvider: (selectedProvider) =>
        set({ selectedProvider }, false, "intelligence/provider"),
      setSelectedModel: (selectedModel) =>
        set({ selectedModel }, false, "intelligence/model"),
    }),
    {
      name: "AgbofaIntelligenceStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
