import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/intelligence.css";
export const metadata: Metadata = {
  title: "Predictive Intelligence",
  robots: { index: false, follow: false },
};
export default function PredictiveLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
