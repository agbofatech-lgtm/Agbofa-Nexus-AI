import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/newsroom.css";

export const metadata: Metadata = {
  title: "Newsroom",
  description:
    "Editorial command, origination, production, and review workspace.",
  robots: { index: false, follow: false },
};

export default function NewsroomLayout({ children }: { children: ReactNode }) {
  return <div className="newsroom-route">{children}</div>;
}
