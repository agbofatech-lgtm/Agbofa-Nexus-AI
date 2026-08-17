"use client";

import { VideoOff } from "lucide-react";
import { useState } from "react";

import { WatermarkLogo } from "@/components/shared/media/WatermarkLogo";
import { cn } from "@/lib/utils/cn";

export interface WatermarkedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  title?: string;
  watermarkPosition?: "bottom-right" | "bottom-left" | "center";
  watermarkVariant?: "full" | "small" | "mini";
}

export function WatermarkedVideo({
  src,
  poster,
  className,
  title = "Agbofa Nexus video",
  watermarkPosition = "bottom-right",
  watermarkVariant = "small",
}: WatermarkedVideoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="watermarked-video" data-watermarked="true">
      {failed ? (
        <div className="watermarked-media__fallback" role="alert">
          <VideoOff size={28} />
          <span>Video unavailable</span>
        </div>
      ) : (
        <video
          aria-label={title}
          className={cn("watermarked-video__element", className)}
          controls
          onError={() => setFailed(true)}
          playsInline
          poster={poster}
          preload="metadata"
          src={src}
        />
      )}
      <div
        aria-hidden="true"
        className={cn(
          "watermarked-media__brand",
          `watermarked-media__brand--${watermarkPosition}`,
        )}
      >
        <WatermarkLogo variant={watermarkVariant} />
      </div>
      <div aria-hidden="true" className="watermarked-media__gradient" />
    </div>
  );
}
