import { ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";

export interface HeroImageProps {
  src?: string;
  alt: string;
  priority?: boolean;
}

export function HeroImage({ src, alt, priority = false }: HeroImageProps) {
  return (
    <figure className="story-hero-image">
      {src ? (
        <Image
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 1400px"
          src={src}
        />
      ) : (
        <div className="story-hero-image__fallback" role="img" aria-label={alt}>
          <ImageIcon size={38} />
          <span>Agbofa Nexus editorial illustration</span>
        </div>
      )}
      <div className="story-hero-image__overlay" />
      <figcaption>
        <Sparkles size={12} /> Nexus visual intelligence
      </figcaption>
    </figure>
  );
}
