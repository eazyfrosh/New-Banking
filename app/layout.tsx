import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";
import { DemoBanner } from "@/components/shared/demo-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A malformed NEXT_PUBLIC_APP_URL would otherwise throw synchronously here,
// during module evaluation of the root layout - which runs while
// prerendering every page at build time, failing the whole build over a
// single bad env var. Fall back to a safe default instead.
function resolveMetadataBase(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Novaofficial — Modern Digital Banking",
    template: "%s · Novaofficial",
  },
  description:
    "Novaofficial is a premium digital banking platform for everyday spending, saving, investing and borrowing — all in one beautifully designed app.",
  keywords: [
    "digital bank",
    "online banking",
    "fintech",
    "savings",
    "loans",
    "investments",
  ],
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DemoBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
