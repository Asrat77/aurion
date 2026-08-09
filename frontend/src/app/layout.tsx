import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Manrope, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ChannelChrome from "@/components/ChannelChrome";
import { CHANNEL } from "@/lib/channel";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Amharic renders in Ethiopic script, which none of the Latin faces cover.
// Loaded alongside them so switching language does not fall back to a system
// font mid-page.
const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000" },
  title: {
    default: CHANNEL === "business" ? "AURION Business | Source at Scale" : CHANNEL === "operations" ? "AURION Operations" : "AURION Express | Ethiopian Origin, Global Reach",
    template: CHANNEL === "business" ? "%s | AURION Business" : CHANNEL === "operations" ? "%s | AURION Operations" : "%s | AURION Express",
  },
  description:
    CHANNEL === "business" ? "Source Ethiopian products at scale with structured RFQs, supplier offers, and protected trade records." : "Discover Ethiopian products at retail through AURION Express.",
  openGraph: {
    title: CHANNEL === "business" ? "AURION Business | Source at Scale" : "AURION Express | Ethiopian Origin, Global Reach",
    description: CHANNEL === "business" ? "Commercial sourcing from requirement to accountable trade." : "Shop Ethiopian-origin products with AURION Express.",
    images: ["/brand/aurion-emblem.png"],
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
      className={`${cormorant.variable} ${manrope.variable} ${jetbrainsMono.variable} ${notoEthiopic.variable}`}
    >
      <body className="min-h-dvh flex flex-col overflow-x-hidden">
        <Providers>
          <ChannelChrome channel={CHANNEL}>{children}</ChannelChrome>
        </Providers>
      </body>
    </html>
  );
}
