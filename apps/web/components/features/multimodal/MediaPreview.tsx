import { DatabaseZap } from "lucide-react";

import { AudioAnalysis } from "@/components/features/multimodal/AudioAnalysis";
import { ImageAnalysis } from "@/components/features/multimodal/ImageAnalysis";
import { VideoAnalysis } from "@/components/features/multimodal/VideoAnalysis";
import type { MediaAnalysis } from "@/types/multimodal";

export function MediaPreview({ analysis }: { analysis: MediaAnalysis | null }) {
  if (!analysis)
    return (
      <div className="media-analysis-empty glass">
        <DatabaseZap size={25} />
        <strong>No demo analysis available.</strong>
        <p>
          Choose a valid local media file to run frontend-only sample
          processing.
        </p>
      </div>
    );
  if (analysis.kind === "image") return <ImageAnalysis analysis={analysis} />;
  if (analysis.kind === "video") return <VideoAnalysis analysis={analysis} />;
  return <AudioAnalysis analysis={analysis} />;
}
