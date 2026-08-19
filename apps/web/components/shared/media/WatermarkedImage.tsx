"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { WatermarkLogo } from "@/components/shared/media/WatermarkLogo";
import { cn } from "@/lib/utils/cn";

export interface WatermarkedImageProps {
  src?: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
  watermarkPosition?: "bottom-right" | "bottom-left" | "center";
  watermarkVariant?: "full" | "small" | "mini";
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  quality?: number;
}

export function WatermarkedImage({
  src,
  alt,
  className,
  wrapperClassName,
  priority = false,
  watermarkPosition = "bottom-right",
  watermarkVariant = "small",
  fill = false,
  width,
  height,
  sizes,
  quality,
}: WatermarkedImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "watermarked-media",
        fill && "watermarked-media--fill",
        wrapperClassName,
      )}
      data-watermarked="true"
    >
      {failed || !src ? (
        <div
          className="watermarked-media__fallback"
          role="img"
          aria-label={alt}
        >
          <ImageOff size={28} />
          <span>Media unavailable</span>
        </div>
      ) : (
        <Image
          {...(fill
            ? { fill: true }
            : { width: width ?? 1200, height: height ?? 675 })}
          alt={alt}
          className={cn("watermarked-media__image", className)}
          onError={() => setFailed(true)}
          priority={priority}
          quality={quality}
          sizes={sizes}
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
