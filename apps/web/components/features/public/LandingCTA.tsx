"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui";

export function LandingCTA() {
  const exploreCapabilities = () => {
    document.getElementById("capabilities")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="landing-cta">
      <Link className="landing-cta__primary" href="/login">
        Enter AI Reader Workspace
        <ArrowRight size={18} />
      </Link>
      <Button onClick={exploreCapabilities} size="lg" variant="ghost">
        Explore the platform
        <ArrowDown size={16} />
      </Button>
    </div>
  );
}
