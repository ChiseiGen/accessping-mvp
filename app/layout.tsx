import type { Metadata } from "next";
import type { Viewport } from "next";
import { Poppins, Roboto_Mono } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://accessping.app"),
  title: {
    default: "AccessPing",
    template: "%s | AccessPing"
  },
  description:
    "Find common accessibility issues before client handoff and turn WCAG scans into clear launch-ready fix lists.",
  applicationName: "AccessPing",
  keywords: [
    "accessibility scanner",
    "WCAG audit",
    "website accessibility",
    "agency report",
    "SaaS audit"
  ],
  openGraph: {
    title: "AccessPing",
    description:
      "A pre-handoff accessibility check for agencies, freelancers, and SaaS teams.",
    siteName: "AccessPing",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AccessPing",
    description:
      "Find common accessibility issues before client handoff and turn scans into clear fix lists."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" }
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
      <body>{children}</body>
    </html>
  );
}
