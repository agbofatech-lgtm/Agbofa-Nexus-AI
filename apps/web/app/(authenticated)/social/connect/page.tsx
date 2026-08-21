"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { csrfHeaders } from "@/lib/bff/csrf-client";

function ConnectYouTube() {
  const params = useSearchParams();
  const platform = params.get("platform") || "youtube";
  const [message, setMessage] = useState("Starting YouTube authorization…");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/v1/social/connect", {
        method: "POST",
        headers: { "content-type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ platform }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        authorization_url?: string;
        error?: string;
      };
      if (cancelled) return;
      const url = body.authorization_url;
      if (!response.ok || !url) {
        setMessage(
          `Connect failed (${body.error ?? response.status}). Re-login if this is csrf_rejected or unauthenticated.`,
        );
        return;
      }
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        setMessage("Connect failed: authorization URL was not absolute.");
        return;
      }
      if (parsed.searchParams.get("response_type") !== "code") {
        setMessage("Connect failed: authorization URL missing response_type=code.");
        return;
      }
      window.location.assign(parsed.toString());
    })().catch(() => {
      if (!cancelled) setMessage("Connect failed: network error.");
    });
    return () => {
      cancelled = true;
    };
  }, [platform]);

  return (
    <main>
      <p role="status">{message}</p>
    </main>
  );
}

export default function SocialConnectPage() {
  return (
    <Suspense fallback={<p role="status">Starting YouTube authorization…</p>}>
      <ConnectYouTube />
    </Suspense>
  );
}
