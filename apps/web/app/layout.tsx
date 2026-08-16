import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/providers/ThemeProvider";

import "./globals.css";

const themeInitializationScript = `
(function () {
  try {
    var saved = localStorage.getItem('agbofa-nexus-theme') || 'dark';
    var resolved = saved === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : saved;
    var root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(resolved);
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  } catch (_) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export const metadata: Metadata = {
  title: {
    default: "Agbofa Nexus AI",
    template: "%s · Agbofa Nexus AI",
  },
  description:
    "An AI-powered media intelligence and newsroom command platform by Agbofa Technologies.",
  applicationName: "Agbofa Nexus AI",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#F4F1E8" },
  ],
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className="dark" data-theme="dark" lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
