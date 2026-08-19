import type { ReactNode } from "react";

import "@/styles/story.css";

interface StoryDetailLayoutProps {
  children: ReactNode;
}

export default function StoryDetailLayout({
  children,
}: StoryDetailLayoutProps) {
  return children;
}
