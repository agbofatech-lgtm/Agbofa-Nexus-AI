import type { DistributionChannel } from "@/types/business";
import type {
  PlatformPreviewData,
  PlatformTemplate,
} from "@/types/distribution";
function templateFor(platform: string): PlatformTemplate {
  const n = platform.toLowerCase();
  if (n.includes("facebook")) return "facebook";
  if (n.includes("instagram")) return "instagram";
  if (n === "x" || n.endsWith(" x")) return "x";
  if (n.includes("youtube")) return "youtube";
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("threads")) return "threads";
  return "generic";
}
function shorten(v: string, l: number) {
  return v.length <= l ? v : `${v.slice(0, Math.max(0, l - 1)).trimEnd()}…`;
}
function body(c: string, t: PlatformTemplate) {
  const v = c.trim();
  switch (t) {
    case "facebook":
      return `${v}\n\nExplore the evidence and full intelligence brief.`;
    case "instagram":
      return `${v}\n\n#AfricanInnovation #Technology #NexusAI`;
    case "x":
      return shorten(`${v} #NexusAI`, 280);
    case "youtube":
      return `TITLE\n${shorten(v, 90)}\n\nDESCRIPTION\n${v}`;
    case "tiktok":
      return `HOOK\n${shorten(v, 72)}\n\nCAPTION\n${shorten(v, 150)} #TechTok #NexusAI`;
    case "linkedin":
      return `${v}\n\nWhat this means for technology leaders and emerging markets — explore the full analysis.`;
    case "threads":
      return `${shorten(v, 430)}\n\nWhat signal are you watching next?`;
    default:
      return v;
  }
}
const presentation: Record<
  PlatformTemplate,
  Pick<PlatformPreviewData, "format" | "guidance" | "characterLimit">
> = {
  facebook: {
    format: "Rich media + link preview",
    guidance: "Longer context, evidence link, and clear call to action",
    characterLimit: 5000,
  },
  instagram: {
    format: "Portrait / carousel caption",
    guidance: "Visual lead, concise caption, hashtags, and reel/story variants",
    characterLimit: 2200,
  },
  x: {
    format: "Short post / thread opener",
    guidance:
      "One clear signal, media context, and optional thread continuation",
    characterLimit: 280,
  },
  youtube: {
    format: "Title + description + thumbnail brief",
    guidance:
      "Searchable title, evidence-led description, tags, and thumbnail direction",
    characterLimit: 5000,
  },
  tiktok: {
    format: "Video hook + caption",
    guidance:
      "Immediate hook, short context, caption, and discoverability tags",
    characterLimit: 2200,
  },
  linkedin: {
    format: "Professional insight post",
    guidance:
      "Business implication, evidence, article/media attachment, and CTA",
    characterLimit: 3000,
  },
  threads: {
    format: "Conversational short post",
    guidance: "Natural voice, compact context, media, and reply prompt",
    characterLimit: 500,
  },
  generic: {
    format: "Channel-ready draft",
    guidance: "Review channel requirements before manual distribution",
    characterLimit: null,
  },
};
export function adaptDistributionContent(
  content: string,
  channels: readonly DistributionChannel[],
): PlatformPreviewData[] {
  if (!content.trim()) return [];
  return channels.map((c) => {
    const t = templateFor(c.platform);
    return {
      channelId: c.id,
      platform: c.platform,
      template: t,
      body: body(content, t),
      provenance: "local-template",
      ...presentation[t],
    };
  });
}
