import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://prism-app.vercel.app";

export const viewport: Viewport = {
  themeColor: "#8B1A2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "PRISM — Community Perspectives",
  description:
    "See how communities experience the same events. Geographic perspectives, visualized.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRISM",
  },
  openGraph: {
    type: "website",
    siteName: "PRISM",
    title: "PRISM — Community Perspectives",
    description:
      "See how communities experience the same events. Geographic perspectives, visualized.",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: "PRISM — Geographic Community Perspectives",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRISM — Community Perspectives",
    description:
      "See how communities experience the same events. Geographic perspectives, visualized.",
    images: [`${siteUrl}/api/og`],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${playfairDisplay.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/api/icon?size=180" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-prism-bg-primary text-prism-text-primary antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-prism-accent-active focus:text-white focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <PWAInstallPrompt />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
