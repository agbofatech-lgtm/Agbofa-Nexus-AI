import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SessionProvider } from "@/providers/SessionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

import "./globals.css";
import "../styles/public.css";
import "../styles/watermark.css";

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

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL("https://agbofanexus.ai"),
  title: {
    default:
      "Agbofa Nexus AI — AI-powered media covering technology, innovation & the future.",
    template: "%s · Agbofa Nexus AI",
  },
  description:
    "AI-powered media covering technology, innovation, business, startups, science, news, analysis, Ghana, Africa, and global developments.",
  keywords: [
    "AI",
    "technology",
    "innovation",
    "business",
    "startups",
    "science",
    "news",
    "Ghana",
    "Africa",
    "media",
  ],
  authors: [{ name: "Agbofa Technologies" }],
  creator: "Agbofa Technologies",
  publisher: "Agbofa Technologies",
  applicationName: "Agbofa Nexus AI",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "Agbofa Nexus AI — AI-powered media",
    description:
      "AI-powered media covering technology, innovation & the future.",
    url: "https://agbofanexus.ai",
    siteName: "Agbofa Nexus AI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Agbofa Nexus AI — intelligence for what comes next",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agbofa Nexus AI — AI-powered media",
    description:
      "AI-powered media covering technology, innovation & the future.",
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
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
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
