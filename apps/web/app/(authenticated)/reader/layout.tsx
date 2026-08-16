import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/reader.css";

export const metadata: Metadata = {
  title: "Reader",
  description:
    "Personalized, verified stories from the Agbofa Nexus intelligence network.",
  robots: { index: false, follow: false },
};

interface ReaderLayoutProps {
  children: ReactNode;
}

export default function ReaderLayout({ children }: ReaderLayoutProps) {
  return <div className="reader-route">{children}</div>;
}
