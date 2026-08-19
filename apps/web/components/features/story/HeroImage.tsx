import { Sparkles } from "lucide-react";

import { WatermarkedImage } from "@/components/shared/media/WatermarkedImage";

export interface HeroImageProps {
  src?: string;
  alt: string;
  priority?: boolean;
}

export function HeroImage({ src, alt, priority = false }: HeroImageProps) {
  return (
    <figure className="story-hero-image">
      <WatermarkedImage
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 1400px"
        src={src}
        watermarkPosition="bottom-right"
        watermarkVariant="full"
      />
      <div className="story-hero-image__overlay" />
      <figcaption>
        <Sparkles size={12} /> Nexus visual intelligence
      </figcaption>
    </figure>
  );
}
