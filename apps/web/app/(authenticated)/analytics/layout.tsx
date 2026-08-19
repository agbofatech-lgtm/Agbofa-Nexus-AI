import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/business.css";
import "@/styles/phase-three.css";
export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
