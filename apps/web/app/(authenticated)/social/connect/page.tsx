import { redirect } from "next/navigation";

export default async function SocialConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const params = await searchParams;
  const platform = params.platform || "youtube";
  redirect(`/api/v1/social/connect?platform=${encodeURIComponent(platform)}`);
}
