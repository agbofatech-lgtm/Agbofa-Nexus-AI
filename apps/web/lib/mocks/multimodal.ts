import type { MultimodalWorkspaceData } from "@/types/multimodal";

export const mockMultimodalData: MultimodalWorkspaceData = {
  sampleAnalysis: {
    kind: "image",
    objects: [
      "conference stage",
      "presentation display",
      "audience",
      "brand mark",
    ],
    ocr: ["AI Infrastructure Forum", "Accra · Demo Analysis"],
    entities: ["Accra", "Agbofa Technologies", "AI infrastructure"],
    authenticity: 89,
    confidence: 91,
    metadata: {
      dimensions: "1920×1080",
      colorProfile: "sRGB",
      sampleSource: "Demo media fixture",
      processing: "Frontend simulation",
    },
  },
  relationships: [
    {
      id: "rel-1",
      from: "Image",
      to: "Article",
      relationship: "Shared event and location entities",
      confidence: 91,
    },
    {
      id: "rel-2",
      from: "Video",
      to: "Article",
      relationship: "Transcript aligns with quoted statement",
      confidence: 87,
    },
    {
      id: "rel-3",
      from: "Audio",
      to: "Video",
      relationship: "Speaker and timing overlap",
      confidence: 84,
    },
    {
      id: "rel-4",
      from: "Image",
      to: "Video",
      relationship: "Matching scene composition",
      confidence: 79,
    },
  ],
  processedToday: 248,
  averageConfidence: 87.4,
  mode: "demo",
  dataStatus: "partial",
};
