import type { Metadata } from "next";
import type { Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Poppins, Roboto_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = "https://accessping-mvp.vercel.app";
const siteTitle = "AccessPing";
const siteDescription =
  "Catch common accessibility issues before client review and turn public page scans into client-ready handoff reports.";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap"
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AccessPing | Client-ready accessibility handoff reports",
    template: "%s | AccessPing"
  },
  description: siteDescription,
  applicationName: siteTitle,
  alternates: {
    canonical: "/"
  },
  keywords: [
    "accessibility scanner",
    "WCAG audit",
    "WCAG report",
    "website accessibility",
    "client handoff",
    "agency QA",
    "accessibility report"
  ],
  authors: [{ name: "AccessPing" }],
  creator: "AccessPing",
  publisher: "AccessPing",
  category: "accessibility software",
  openGraph: {
    title: "AccessPing | Client-ready accessibility handoff reports",
    description: siteDescription,
    url: siteUrl,
    siteName: siteTitle,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AccessPing accessibility report preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "AccessPing | Client-ready accessibility handoff reports",
    description: siteDescription,
    images: ["/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#101411" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${robotoMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.svglogos.dev" />
        <link rel="preconnect" href="https://upload.wikimedia.org" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
