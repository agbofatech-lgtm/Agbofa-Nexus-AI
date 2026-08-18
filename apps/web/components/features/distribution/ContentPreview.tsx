import {
  BriefcaseBusiness,
  Image as ImageIcon,
  MessageCircle,
  PlaySquare,
  type LucideIcon,
} from "lucide-react";
import { WatermarkLogo } from "@/components/shared/media/WatermarkLogo";
import type {
  PlatformPreviewData,
  PlatformTemplate,
} from "@/types/distribution";
const icons: Record<PlatformTemplate, LucideIcon> = {
  facebook: MessageCircle,
  instagram: ImageIcon,
  x: MessageCircle,
  youtube: PlaySquare,
  tiktok: PlaySquare,
  linkedin: BriefcaseBusiness,
  threads: MessageCircle,
  generic: MessageCircle,
};
export function ContentPreview({ preview }: { preview: PlatformPreviewData }) {
  const Icon = icons[preview.template];
  return (
    <article
      className={`distribution-preview distribution-preview--${preview.template}`}
    >
      <header>
        <span>
          <Icon aria-hidden="true" size={15} />
          {preview.platform}
        </span>
        <WatermarkLogo variant="mini" />
      </header>
      <div className="distribution-preview__format">
        <strong>{preview.format}</strong>
        <small>{preview.guidance}</small>
      </div>
      <p>{preview.body}</p>
      <footer>
        <span>Local template preview</span>
        <span>
          {preview.characterLimit
            ? `${preview.body.length}/${preview.characterLimit}`
            : `${preview.body.length} characters`}
        </span>
      </footer>
    </article>
  );
}
