import type { Metadata } from "next";

import "./globals.css";
import { OfflineRuntime } from "@/components/offline/offline-runtime";

export const metadata: Metadata = {
  title: "SAES Asset Register",
  description: "Asset, consumable, deployment, maintenance, and reporting PWA for SAES Victoria.",
  manifest: "/manifest.webmanifest",
  applicationName: "SAES Asset Register",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SAES Asset Register",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-192.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <OfflineRuntime />
      </body>
    </html>
  );
}
