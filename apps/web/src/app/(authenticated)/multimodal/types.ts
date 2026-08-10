/**
 * Agbofa Nexus AI — Multimodal Intelligence Workspace Authoritative TypeScript Definitions (Phase 3 Batch 16 / IMP-020)
 * Defines structured types for Image Analysis (OCR/vision), Video Analysis (key frames/scenes),
 * Audio Transcription (diarization/sentiment), and Cross-Media Consistency Verification (AGT-013 & AGT-013-CROSS).
 */

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "CROSS_MEDIA";

export type AnalysisStatus = "COMPLETE" | "PROCESSING" | "QUOTA_LIMITED" | "FAILED";

export interface RecentAnalysisItem {
  id: string;
  mediaType: MediaType;
  title: string;
  sourceName: string;
  contentPreview: string;
  timestamp: string; // ISO 8601
  status: AnalysisStatus;
  modelUsed: string; // e.g. "GPT-4V", "Claude 3 Vision", "Whisper-1", "AGT-013-CROSS"
  confidenceScore: number; // 0.0 to 1.0
}

export interface BoundingBox {
  xMin: number; // 0.0 to 1.0 percentage coordinate
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface DetectedObjectItem {
  id: string;
  label: string;
  confidence: number; // 0.0 to 1.0
  bbox: BoundingBox;
  colorHex: string;
}

export interface ImageMetadata {
  format: string; // e.g. "IMAGE/WEBP", "IMAGE/PNG"
  width: number;
  height: number;
  fileSizeBytes: number;
  sourceAttribution: string;
  analyzedAt: string; // ISO 8601
  modelUsed: string; // "GPT-4V" | "Claude Vision"
  tokenQuotaUsed: number; // 85 tokens/image
}

export interface ImageAnalysisItem {
  id: string;
  storyId: string;
  title: string;
  mediaUrl: string;
  ocrText: string;
  aiDescription: string;
  detectedObjects: DetectedObjectItem[];
  visualSentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "URGENT";
  metadata: ImageMetadata;
}

export interface FrameDetectionItem {
  id: string;
  label: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface KeyFrameItem {
  id: string;
  frameNumber: number;
  timestampSeconds: number;
  timestampDisplay: string; // "00:12"
  frameUrl: string;
  sceneDescription: string;
  detectedObjects: FrameDetectionItem[];
}

export interface TemporalEventItem {
  id: string;
  timestampRange: string; // "00:00 – 00:18"
  eventLabel: string;
  confidence: number;
  detectedActors: string[];
}

export interface VideoMetadata {
  durationSeconds: number;
  format: string; // "VIDEO/MP4"
  resolution: string; // "1920x1080"
  frameRateFps: number; // 30
  sourceAttribution: string;
  analyzedAt: string;
  keyFramesExtracted: number; // Max 5 quota limit
  modelUsed: string;
  tokenQuotaUsed: number;
}

export interface VideoAnalysisItem {
  id: string;
  storyId: string;
  title: string;
  videoUrl: string;
  keyFrames: KeyFrameItem[]; // max 5
  temporalEvents: TemporalEventItem[];
  overallSceneSummary: string;
  metadata: VideoMetadata;
}

export interface SpeakerSegmentItem {
  id: string;
  speakerId: string; // e.g. "SPEAKER_00", "SPEAKER_01"
  speakerNameDisplay: string; // "Moderator (Sarah)", "Guest Expert"
  colorHex: string; // Distinct speaker color
  startMs: number;
  endMs: number;
  timestampDisplay: string; // "01:15 - 01:42"
  text: string;
  confidence: number; // 0.0 to 1.0
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
}

export interface SpeakerLegendItem {
  speakerId: string;
  name: string;
  colorHex: string;
  speakingTimePercentage: number;
  segmentCount: number;
}

export interface AudioSentimentBreakdown {
  overallSentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";
  overallScore: number; // -1.0 to 1.0
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  emotionalIntensity: "HIGH" | "MODERATE" | "LOW";
  confidenceScore: number;
}

export interface AudioMetadata {
  durationSeconds: number;
  format: string; // "AUDIO/MP3"
  detectedLanguage: string; // "en-US", "es-ES"
  sourceAttribution: string;
  transcriptionModel: string; // "whisper-1"
  analyzedAt: string;
  tokenQuotaUsed: number; // 30 tokens/clip
}

export interface AudioAnalysisItem {
  id: string;
  storyId: string;
  title: string;
  audioUrl: string;
  fullTranscript: string;
  speakerSegments: SpeakerSegmentItem[];
  speakerLegend: SpeakerLegendItem[];
  sentimentBreakdown: AudioSentimentBreakdown;
  metadata: AudioMetadata;
}

export type ConsistencyVerdict =
  | "CONSISTENT" // #0D9040
  | "MINOR_INCONSISTENCY" // #F59E0B
  | "MAJOR_INCONSISTENCY" // #CF2020
  | "UNCORRELATED" // #A0A4A8
  | "NOT_APPLICABLE"; // #3399FF

export interface ConsistencyCheckDetail {
  id: string;
  comparisonType: string; // e.g. "OCR Text vs. Audio Transcript", "Detected Objects vs. Video Scene", "Speaker Attribution"
  verdict: ConsistencyVerdict;
  confidenceScore: number; // 0.0 to 1.0
  description: string;
  flaggedElements: string[];
  isArtisticExpression: boolean;
}

export interface EvidenceHighlightItem {
  id: string;
  elementType: "OCR_QUOTE" | "TRANSCRIPT_QUOTE" | "VISUAL_OBJECT" | "SPEAKER_IDENTITY";
  content: string;
  status: "CONTRADICTORY" | "CORROBORATING" | "NEUTRAL";
  explanation: string;
}

export interface CrossMediaItem {
  id: string;
  storyId: string;
  title: string;
  mediaTypesIncluded: MediaType[];
  overallVerdict: ConsistencyVerdict;
  overallConfidenceScore: number;
  consistencyPenaltyScore: number; // e.g. -0.40 for major, 0.0 for consistent
  checks: ConsistencyCheckDetail[];
  evidenceHighlights: EvidenceHighlightItem[];
  imageOcrSummary: string;
  audioTranscriptSummary: string;
  videoSceneSummary: string;
  analyzedAt: string;
  agentId: string; // "AGT-013-CROSS"
}

export interface MultimodalOverviewStats {
  mediaItemsAnalyzed24h: number;
  imagesProcessedCount: number;
  videosAnalyzedCount: number;
  audioTranscribedCount: number;
  crossMediaVerifiedCount: number;
  consistencyPassRate: number; // percentage e.g. 94.2%
  avgProcessingTimeSec: number;
  tokenQuotaUsedToday: number;
}
