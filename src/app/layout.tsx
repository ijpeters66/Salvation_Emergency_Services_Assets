import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SAES Asset Register",
  description: "Asset, consumable, deployment, maintenance, and reporting PWA for SAES Victoria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
