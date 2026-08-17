import {
  AlignLeft,
  FileImage,
  FileText,
  Heading,
  Mail,
  Mic,
  Share2,
  Video,
} from "lucide-react";

import type { PackageType } from "@/types/newsroom";

const packageTypes = [
  { id: "article", label: "Article", icon: FileText },
  { id: "social", label: "Social", icon: Share2 },
  { id: "video", label: "Video", icon: Video },
  { id: "audio", label: "Audio", icon: Mic },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "summary", label: "Summary", icon: AlignLeft },
  { id: "headline", label: "Headline", icon: Heading },
  { id: "image", label: "Image", icon: FileImage },
] as const;

interface PackageTypeSelectorProps {
  selected: PackageType[];
  onToggle: (type: PackageType) => void;
}

export function PackageTypeSelector({
  selected,
  onToggle,
}: PackageTypeSelectorProps) {
  return (
    <div
      className="package-type-selector"
      role="group"
      aria-label="Package output types"
    >
      {packageTypes.map((type) => {
        const Icon = type.icon;
        const active = selected.includes(type.id);
        return (
          <button
            key={type.id}
            aria-pressed={active}
            onClick={() => onToggle(type.id)}
            type="button"
          >
            <Icon size={15} /> {type.label}
          </button>
        );
      })}
    </div>
  );
}
