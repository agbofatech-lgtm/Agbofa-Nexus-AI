export type PlatformTemplate =
  | "facebook"
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "threads"
  | "generic";
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
