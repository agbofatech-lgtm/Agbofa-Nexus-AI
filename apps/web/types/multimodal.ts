export type MediaKind = "image" | "video" | "audio";
export type MediaProcessingStatus =
  "idle" | "validating" | "uploading" | "processing" | "success" | "error";

export interface ImageAnalysis {
  kind: "image";
  objects: string[];
  ocr: string[];
  entities: string[];
  authenticity: number;
  confidence: number;
  metadata: Record<string, string>;
}

export interface VideoAnalysis {
  kind: "video";
  transcript: string;
  scenes: number;
  keyframes: string[];
  entities: string[];
  durationSeconds: number;
  confidence: number;
}

export interface AudioAnalysis {
  kind: "audio";
  transcript: string;
  speakers: number;
  language: string;
  durationSeconds: number;
  confidence: number;
}

export type MediaAnalysis = ImageAnalysis | VideoAnalysis | AudioAnalysis;

export interface CrossMediaRelationship {
  id: string;
  from: string;
  to: string;
  relationship: string;
  confidence: number;
}

export interface MediaUploadState {
  status: MediaProcessingStatus;
  progress: number;
  fileName: string | null;
  mediaKind: MediaKind | null;
  error: string | null;
}

export interface MultimodalWorkspaceData {
  sampleAnalysis: MediaAnalysis;
  relationships: CrossMediaRelationship[];
  processedToday: number;
  averageConfidence: number;
  mode: "demo";
  dataStatus: "complete" | "partial" | "unavailable";
}
