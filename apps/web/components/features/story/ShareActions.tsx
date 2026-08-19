"use client";

import {
  BriefcaseBusiness,
  Check,
  Copy,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui";

export interface ShareActionsProps {
  url: string;
  title: string;
  summary?: string;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy was rejected.");
}

export function ShareActions({ url, title, summary }: ShareActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const absoluteUrl =
    typeof window === "undefined"
      ? url
      : new URL(url, window.location.origin).toString();

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const copyLink = async () => {
    try {
      await copyText(absoluteUrl);
      setMessage("Link copied to clipboard.");
    } catch {
      setMessage("Could not copy the link.");
    }
  };

  const shareNative = async () => {
    if (!navigator.share) {
      await copyLink();
      setMessage("Native sharing is unavailable. Link copied instead.");
      return;
    }
    try {
      await navigator.share({ title, text: summary, url: absoluteUrl });
      setMessage("Story shared.");
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Sharing was not completed.");
    }
  };

  const openShareWindow = (destination: "twitter" | "linkedin") => {
    const target =
      destination === "twitter"
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(absoluteUrl)}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteUrl)}`;
    window.open(target, "_blank", "noopener,noreferrer,width=720,height=640");
  };

  return (
    <section className="share-actions" aria-labelledby="share-actions-title">
      <div>
        <span className="section-kicker">
          <Send size={12} /> Pass the signal on
        </span>
        <h2 id="share-actions-title">Share this intelligence</h2>
      </div>
      <div className="share-actions__buttons">
        <Button onClick={() => void copyLink()} size="sm" variant="ghost">
          {message?.startsWith("Link copied") ? (
            <Check size={14} />
          ) : (
            <Copy size={14} />
          )}{" "}
          Copy link
        </Button>
        <Button onClick={() => void shareNative()} size="sm" variant="ghost">
          <Share2 size={14} /> Share
        </Button>
        <Button
          onClick={() => openShareWindow("twitter")}
          size="sm"
          variant="ghost"
        >
          <MessageCircle size={14} /> Twitter
        </Button>
        <Button
          onClick={() => openShareWindow("linkedin")}
          size="sm"
          variant="ghost"
        >
          <BriefcaseBusiness size={14} /> LinkedIn
        </Button>
      </div>
      <span className="share-actions__message" aria-live="polite">
        {message}
      </span>
    </section>
  );
}
