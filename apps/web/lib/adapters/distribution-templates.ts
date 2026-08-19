import type {
  DistributionPreviewTarget,
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
  if (n.includes("pinterest")) return "pinterest";
  if (n.includes("reddit")) return "reddit";
  if (n.includes("telegram")) return "telegram";
  if (n.includes("whatsapp")) return "whatsapp";
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
    case "pinterest":
      return `${shorten(v, 390)}\n\nSave the intelligence brief for later.`;
    case "reddit":
      return `Context and disclosure\n\n${v}\n\nEvidence and methods are available in the full brief. Please review community rules before manual posting.`;
    case "telegram":
      return `INTELLIGENCE BRIEF\n\n${shorten(v, 3900)}\n\nOpen the complete evidence note.`;
    case "whatsapp":
      return `Agbofa briefing\n\n${shorten(v, 3900)}\n\nRead when useful. Shared manually with context.`;
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
  pinterest: {
    format: "Evergreen pin description",
    guidance: "Searchable title, portrait asset, destination, and save-oriented CTA",
    characterLimit: 500,
  },
  reddit: {
    format: "Community-context post",
    guidance: "Transparent identity, subreddit rules, evidence, and discussion prompt",
    characterLimit: 40000,
  },
  telegram: {
    format: "Scannable channel briefing",
    guidance: "Headline, compact context, media, and complete-brief destination",
    characterLimit: 4096,
  },
  whatsapp: {
    format: "Consent-aware manual share",
    guidance: "Trusted context, concise summary, destination, and no hashtag dependency",
    characterLimit: 4096,
  },
  generic: {
    format: "Channel-ready draft",
    guidance: "Review channel requirements before manual distribution",
    characterLimit: null,
  },
};
export function adaptDistributionContent(
  content: string,
  channels: readonly DistributionPreviewTarget[],
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
