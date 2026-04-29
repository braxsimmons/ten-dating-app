import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { TAGLINE, APP_NAME } from "@ten/shared";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${TAGLINE}`,
  description:
    "Ten is a dating app built around intention, scarcity, and better decisions. No endless swiping. Just a daily deck of people worth considering.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
