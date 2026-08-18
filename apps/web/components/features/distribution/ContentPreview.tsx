import { WatermarkLogo } from "@/components/shared/media/WatermarkLogo";
export function ContentPreview({
  content,
  channel,
}: {
  content: string;
  channel: string;
}) {
  return (
    <article className="distribution-preview glass">
      <div>
        <WatermarkLogo variant="mini" />
        <span>{channel || "Select channel"}</span>
      </div>
      <p>
        {content || "Your platform-specific demo preview will appear here."}
      </p>
      <small>DEMO PREVIEW · NO POST WILL BE SENT</small>
    </article>
  );
}
