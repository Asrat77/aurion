import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Manrope, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastHost from "@/components/ToastHost";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/auth/AuthModal";

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
  metadataBase: new URL("https://aurion.appwrite.network"),
  title: {
    default: "AURION Markets | Ethiopian Origin, Global Reach",
    template: "%s | AURION Markets",
  },
  description:
    "Discover Ethiopian products at retail or source commercial quantities through AURION Markets.",
  openGraph: {
    title: "AURION Markets | Ethiopian Origin, Global Reach",
    description: "Shop the origin or source at scale through AURION Markets.",
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
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <Navbar />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <AuthModal />
          <ToastHost />
        </Providers>
      </body>
    </html>
  );
}
