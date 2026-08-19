export type PlatformTemplate =
  | "facebook"
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "threads"
  | "pinterest"
  | "reddit"
  | "telegram"
  | "whatsapp"
  | "generic";
export interface DistributionPreviewTarget {
  id: string;
  platform: string;
}
export interface PlatformPreviewData {
  channelId: string;
  platform: string;
  template: PlatformTemplate;
  format: string;
  body: string;
  guidance: string;
  characterLimit: number | null;
  provenance: "local-template";
}
