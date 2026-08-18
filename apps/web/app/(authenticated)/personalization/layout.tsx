import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/intelligence.css";
export const metadata: Metadata = {
  title: "Personalization Intelligence",
  robots: { index: false, follow: false },
};
export default function PersonalizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
