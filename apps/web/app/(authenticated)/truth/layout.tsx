import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/newsroom.css";
import "@/styles/truth.css";

export const metadata: Metadata = {
  title: "Truth Engine",
  description:
    "Evidence investigation, source credibility, and claim confidence workspace.",
  robots: { index: false, follow: false },
};

export default function TruthLayout({ children }: { children: ReactNode }) {
  return <div className="truth-route">{children}</div>;
}
