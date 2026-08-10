import {
  MultimodalOverviewStats,
  RecentAnalysisItem,
  ImageAnalysisItem,
  VideoAnalysisItem,
  AudioAnalysisItem,
  CrossMediaItem,
} from "./types";

export const INITIAL_OVERVIEW_STATS: MultimodalOverviewStats = {
  mediaItemsAnalyzed24h: 318,
  imagesProcessedCount: 164,
  videosAnalyzedCount: 42,
  audioTranscribedCount: 112,
  crossMediaVerifiedCount: 96,
  consistencyPassRate: 94.2,
  avgProcessingTimeSec: 1.4,
  tokenQuotaUsedToday: 18450,
};

export const SAMPLE_RECENT_ANALYSES: RecentAnalysisItem[] = [
  {
    id: "rec-media-101",
    mediaType: "IMAGE",
    title: "Global AI Workforce Operations Room Photograph",
    sourceName: "Global Wire Services (Reuters/AP)",
    contentPreview:
      "OCR Extracted: 'AGBOFA NEXUS 32-AGENT AUTONOMOUS FLEET CERTIFIED — ZERO FABRICATION'",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    status: "COMPLETE",
    modelUsed: "GPT-4V (Vision)",
    confidenceScore: 0.98,
  },
  {
    id: "rec-media-102",
    mediaType: "VIDEO",
    title: "Breaking Fusion Reactor Ignition Explanation Broadcast",
    sourceName: "Verified RSS Tech & Science Journals",
    contentPreview:
      "5 Key frames extracted (Quota capped). Scene: Plasma confinement vessel interior and control telemetry.",
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
    status: "COMPLETE",
    modelUsed: "Claude 3 Vision + Video Analyzer",
    confidenceScore: 0.94,
  },
  {
    id: "rec-media-103",
    mediaType: "AUDIO",
    title: "Executive Press Briefing on Row-Level Security Policies",
    sourceName: "Official Breaking Desks on X",
    contentPreview:
      "Speaker Diarization: Moderator (Sarah) & Lead Security Architect (Marcus). 100% Transcript Verified.",
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    status: "COMPLETE",
    modelUsed: "Whisper-1",
    confidenceScore: 0.96,
  },
  {
    id: "rec-media-104",
    mediaType: "CROSS_MEDIA",
    title: "Multi-Asset Story: 'Quantum Sensor Array Deployments'",
    sourceName: "Global Wire Services (Reuters/AP)",
    contentPreview:
      "Cross-Media Verification: OCR vs Transcript vs Video Scene consistent across all 3 assets.",
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    status: "COMPLETE",
    modelUsed: "AGT-013-CROSS (1.0.0)",
    confidenceScore: 0.99,
  },
];

export const SAMPLE_IMAGE_ANALYSIS: ImageAnalysisItem = {
  id: "img-001",
  storyId: "story-301",
  title: "Autonomous AI Newsroom Workforce Operations Center",
  mediaUrl:
    "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
  ocrText:
    "AGBOFA NEXUS AI • OPERATIONAL STATUS: 100% HEALTHY • 32 AUTONOMOUS AGENTS ACTIVE • ZERO FABRICATION GUARANTEED",
  aiDescription:
    "High-resolution photograph depicting a modern AI newsroom control center. Multiple widescreen displays render real-time signal streams, verification ledgers, and pipeline throughput graphs. No manipulated artifacts or synthetic generative anomalies are detected.",
  visualSentiment: "POSITIVE",
  detectedObjects: [
    {
      id: "obj-1",
      label: "Verification Agent Console Display",
      confidence: 0.98,
      bbox: { xMin: 0.1, yMin: 0.15, xMax: 0.45, yMax: 0.55 },
      colorHex: "#0066CC",
    },
    {
      id: "obj-2",
      label: "Live Telemetry & MAPE Accuracy Ledger",
      confidence: 0.96,
      bbox: { xMin: 0.5, yMin: 0.15, xMax: 0.88, yMax: 0.55 },
      colorHex: "#0D9040",
    },
    {
      id: "obj-3",
      label: "Operations Command Terminal",
      confidence: 0.91,
      bbox: { xMin: 0.2, yMin: 0.6, xMax: 0.75, yMax: 0.92 },
      colorHex: "#6C5CE7",
    },
    {
      id: "obj-4",
      label: "Authoritative Brand Mark Plaque",
      confidence: 0.89,
      bbox: { xMin: 0.05, yMin: 0.05, xMax: 0.25, yMax: 0.14 },
      colorHex: "#3399FF",
    },
  ],
  metadata: {
    format: "IMAGE/WEBP",
    width: 1920,
    height: 1080,
    fileSizeBytes: 428000,
    sourceAttribution: "Global Wire Services (Reuters/AP)",
    analyzedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    modelUsed: "GPT-4V (Vision)",
    tokenQuotaUsed: 85, // 85 tokens/image quota limit
  },
};

export const SAMPLE_VIDEO_ANALYSIS: VideoAnalysisItem = {
  id: "vid-001",
  storyId: "story-302",
  title: "Breakthrough Fusion Reactor Sustained Plasma Ignition",
  videoUrl:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  overallSceneSummary:
    "High-definition broadcast explainer covering the 18-minute sustained plasma ignition experiment. The footage transitions from exterior research facility establishing shots to magnetic confinement vessel interior views, terminating with data telemetry verification.",
  keyFrames: [
    {
      id: "kf-1",
      frameNumber: 120,
      timestampSeconds: 4,
      timestampDisplay: "00:04",
      frameUrl:
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600&q=80",
      sceneDescription: "Establishing shot of research facility dome and energy grid connection.",
      detectedObjects: [
        {
          id: "kf1-obj1",
          label: "Research Facility Dome",
          confidence: 0.97,
          bbox: { xMin: 0.2, yMin: 0.2, xMax: 0.8, yMax: 0.7 },
        },
      ],
    },
    {
      id: "kf-2",
      frameNumber: 360,
      timestampSeconds: 12,
      timestampDisplay: "00:12",
      frameUrl:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
      sceneDescription: "Lead physicist inspecting magnetic field diagnostic console.",
      detectedObjects: [
        {
          id: "kf2-obj1",
          label: "Diagnostic Console Display",
          confidence: 0.94,
          bbox: { xMin: 0.15, yMin: 0.25, xMax: 0.65, yMax: 0.8 },
        },
      ],
    },
    {
      id: "kf-3",
      frameNumber: 720,
      timestampSeconds: 24,
      timestampDisplay: "00:24",
      frameUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      sceneDescription: "Plasma chamber interior showing toroidal magnetic confinement glow.",
      detectedObjects: [
        {
          id: "kf3-obj1",
          label: "Toroidal Plasma Ring",
          confidence: 0.99,
          bbox: { xMin: 0.25, yMin: 0.2, xMax: 0.75, yMax: 0.75 },
        },
      ],
    },
    {
      id: "kf-4",
      frameNumber: 1140,
      timestampSeconds: 38,
      timestampDisplay: "00:38",
      frameUrl:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
      sceneDescription: "Real-time energy output telemetry showing sustained net gain above baseline.",
      detectedObjects: [
        {
          id: "kf4-obj1",
          label: "Net Gain Graph Curve",
          confidence: 0.95,
          bbox: { xMin: 0.1, yMin: 0.1, xMax: 0.9, yMax: 0.85 },
        },
      ],
    },
    {
      id: "kf-5",
      frameNumber: 1560,
      timestampSeconds: 52,
      timestampDisplay: "00:52",
      frameUrl:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
      sceneDescription: "Closing summary title slide confirming verification by international physicists.",
      detectedObjects: [
        {
          id: "kf5-obj1",
          label: "Official Verification Badge",
          confidence: 0.98,
          bbox: { xMin: 0.35, yMin: 0.35, xMax: 0.65, yMax: 0.65 },
        },
      ],
    },
  ],
  temporalEvents: [
    {
      id: "tev-1",
      timestampRange: "00:00 – 00:10",
      eventLabel: "Exterior Facility Establishing Shot",
      confidence: 0.96,
      detectedActors: ["Research Facility", "Grid Substation"],
    },
    {
      id: "tev-2",
      timestampRange: "00:10 – 00:22",
      eventLabel: "Diagnostic Inspection Sequence",
      confidence: 0.92,
      detectedActors: ["Dr. Elena Vance (Lead Physicist)", "Control Console"],
    },
    {
      id: "tev-3",
      timestampRange: "00:22 – 00:45",
      eventLabel: "Plasma Confinement & Net Energy Ignition",
      confidence: 0.99,
      detectedActors: ["Magnetic Tokamak Chamber", "Plasma Wavefront"],
    },
    {
      id: "tev-4",
      timestampRange: "00:45 – 00:58",
      eventLabel: "Data Verification & Certification Broadcast",
      confidence: 0.95,
      detectedActors: ["Verification Ledger", "Global Science Board"],
    },
  ],
  metadata: {
    durationSeconds: 58,
    format: "VIDEO/MP4",
    resolution: "1920x1080 (Full HD)",
    frameRateFps: 30,
    sourceAttribution: "Verified RSS Tech & Science Journals",
    analyzedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    keyFramesExtracted: 5, // Capped at max 5 quota limit
    modelUsed: "Claude 3 Vision + Video Analyzer",
    tokenQuotaUsed: 425, // 5 frames * 85 tokens
  },
};

export const SAMPLE_AUDIO_ANALYSIS: AudioAnalysisItem = {
  id: "aud-001",
  storyId: "story-303",
  title: "Agbofa Nexus AI Press Briefing on Strict Tenant RLS Governance",
  audioUrl:
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  fullTranscript:
    "Welcome to the technical briefing. Today we confirm that our PostgreSQL database architecture enforces strict Row-Level Security across all 32 autonomous agents. Every SQL transaction binds app.current_tenant, ensuring that zero cross-tenant preference bleed is mathematically possible. Our editorial independence guarantee is certified by international auditors.",
  speakerLegend: [
    {
      speakerId: "SPEAKER_00",
      name: "Moderator (Sarah Jenkins)",
      colorHex: "#0066CC",
      speakingTimePercentage: 35,
      segmentCount: 2,
    },
    {
      speakerId: "SPEAKER_01",
      name: "Lead Security Architect (Marcus Vance)",
      colorHex: "#0D9040",
      speakingTimePercentage: 65,
      segmentCount: 3,
    },
  ],
  speakerSegments: [
    {
      id: "seg-1",
      speakerId: "SPEAKER_00",
      speakerNameDisplay: "Moderator (Sarah Jenkins)",
      colorHex: "#0066CC",
      startMs: 0,
      endMs: 14000,
      timestampDisplay: "00:00 – 00:14",
      text: "Welcome to the technical briefing. Today we confirm that our PostgreSQL database architecture enforces strict Row-Level Security across all 32 autonomous agents.",
      confidence: 0.98,
      sentiment: "NEUTRAL",
    },
    {
      id: "seg-2",
      speakerId: "SPEAKER_01",
      speakerNameDisplay: "Lead Security Architect (Marcus Vance)",
      colorHex: "#0D9040",
      startMs: 14000,
      endMs: 38000,
      timestampDisplay: "00:14 – 00:38",
      text: "Every SQL transaction binds app.current_tenant, ensuring that zero cross-tenant preference bleed is mathematically possible.",
      confidence: 0.99,
      sentiment: "POSITIVE",
    },
    {
      id: "seg-3",
      speakerId: "SPEAKER_01",
      speakerNameDisplay: "Lead Security Architect (Marcus Vance)",
      colorHex: "#0D9040",
      startMs: 38000,
      endMs: 54000,
      timestampDisplay: "00:38 – 00:54",
      text: "Our editorial independence guarantee is certified by international auditors, and no agent ever modifies its own code.",
      confidence: 0.97,
      sentiment: "POSITIVE",
    },
  ],
  sentimentBreakdown: {
    overallSentiment: "POSITIVE",
    overallScore: 0.82,
    positivePercentage: 72,
    neutralPercentage: 24,
    negativePercentage: 4,
    emotionalIntensity: "MODERATE",
    confidenceScore: 0.95,
  },
  metadata: {
    durationSeconds: 54,
    format: "AUDIO/MP3",
    detectedLanguage: "en-US (English)",
    sourceAttribution: "Official Breaking Desks on X",
    transcriptionModel: "Whisper-1",
    analyzedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    tokenQuotaUsed: 30, // 30 tokens per audio clip quota limit
  },
};

export const SAMPLE_CROSS_MEDIA_ANALYSIS: CrossMediaItem = {
  id: "cross-001",
  storyId: "story-304",
  title: "Multi-Asset Verification: 'Global AI Workforce Expansion & Governance'",
  mediaTypesIncluded: ["IMAGE", "VIDEO", "AUDIO"],
  overallVerdict: "CONSISTENT",
  overallConfidenceScore: 0.97,
  consistencyPenaltyScore: 0.0, // 0.0 for consistent; would be -0.40 for major contradiction
  analyzedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  agentId: "AGT-013-CROSS (v1.0.0)",
  imageOcrSummary:
    "OCR text from press conference slide: '32-AGENT AUTONOMOUS NEWSROOM — FULL TENANT ISOLATION — ZERO FABRICATION'.",
  audioTranscriptSummary:
    "Spoken audio transcript confirms deployment of 32 autonomous agents across 4 squads with RLS tenant boundary enforcement.",
  videoSceneSummary:
    "Video footage shows executive press briefing with matching slide presentation and live telemetry monitors.",
  checks: [
    {
      id: "chk-1",
      comparisonType: "Image OCR Text vs. Audio Transcription",
      verdict: "CONSISTENT",
      confidenceScore: 0.98,
      description:
        "Factual alignment verified between OCR slide text ('32-AGENT AUTONOMOUS NEWSROOM') and speaker statement by Marcus Vance.",
      flaggedElements: ["'32-AGENT AUTONOMOUS NEWSROOM'", "'32 autonomous agents across 4 squads'"],
      isArtisticExpression: false,
    },
    {
      id: "chk-2",
      comparisonType: "Video Scene Detections vs. Spoken Topic Attribution",
      verdict: "CONSISTENT",
      confidenceScore: 0.96,
      description:
        "Visual scene depicts operations control desk while audio discusses real-time pipeline monitoring and quota ledgers.",
      flaggedElements: ["Operations Command Console", "Pipeline quota monitor"],
      isArtisticExpression: false,
    },
    {
      id: "chk-3",
      comparisonType: "Stylized Graphic Color Overlay vs. Formal Press Photo",
      verdict: "MINOR_INCONSISTENCY",
      confidenceScore: 0.88,
      description:
        "Infographic uses stylized high-contrast brand colors (#0066CC / #6C5CE7) which differ slightly from ambient lighting in press room photograph.",
      flaggedElements: ["Color grading filter", "Ambient lighting contrast"],
      isArtisticExpression: true, // Artistic expression never flagged as inconsistency!
    },
    {
      id: "chk-4",
      comparisonType: "Single-Media Audio Feature Verification",
      verdict: "NOT_APPLICABLE",
      confidenceScore: 1.0,
      description:
        "Single-media asset check: no secondary visual asset to compare against standalone podcast intro clip.",
      flaggedElements: [],
      isArtisticExpression: false,
    },
  ],
  evidenceHighlights: [
    {
      id: "ev-1",
      elementType: "OCR_QUOTE",
      content: "OCR Text: '32-AGENT AUTONOMOUS FLEET CERTIFIED — ZERO FABRICATION'",
      status: "CORROBORATING",
      explanation:
        "Corroborates spoken statement at timestamp 00:14 confirming full operational certification.",
    },
    {
      id: "ev-2",
      elementType: "TRANSCRIPT_QUOTE",
      content:
        "Transcript: 'Every SQL transaction binds app.current_tenant, ensuring zero cross-tenant bleed'",
      status: "CORROBORATING",
      explanation:
        "Matches visual RLS architecture diagram rendered on the Operations Command display.",
    },
    {
      id: "ev-3",
      elementType: "VISUAL_OBJECT",
      content: "Visual Object: Infographic Stylized Lighting Filter",
      status: "NEUTRAL",
      explanation:
        "Artistic expression never flagged as inconsistency — visual color grading is editorial styling, not a factual contradiction.",
    },
  ],
};
