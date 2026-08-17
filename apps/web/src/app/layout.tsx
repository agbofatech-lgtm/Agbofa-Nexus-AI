import React from "react";
import type { Metadata, Viewport } from "next";
import { AuthoritativeBrandIdentity } from "@agbofa/config";
import { ThemeProvider } from "../components/theme/theme-provider";
import { SessionProvider } from "../components/auth/session-provider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: AuthoritativeBrandIdentity.themeColor,
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: AuthoritativeBrandIdentity.title,
  description: AuthoritativeBrandIdentity.description,
  applicationName: AuthoritativeBrandIdentity.productName,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.svg",
  },
  openGraph: {
    title: AuthoritativeBrandIdentity.title,
    description: AuthoritativeBrandIdentity.description,
    images: [{ url: "/og/default.svg", width: 1200, height: 630 }],
    siteName: AuthoritativeBrandIdentity.productName,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0A0A0B] text-[#FAFAFA] antialiased">
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
