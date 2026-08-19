import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/business.css";
import "@/styles/growth-os.css";
import "@/styles/growth-os.css";
export const metadata: Metadata = {
  title: "Growth Intelligence",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
