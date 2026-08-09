"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastHost from "@/components/ToastHost";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/auth/AuthModal";
import SkipLink from "@/components/SkipLink";
import BusinessNav from "@/components/business/BusinessNav";
import BusinessFooter from "@/components/business/BusinessFooter";
import AssistantWidget from "@/components/assistant/AssistantWidget";
import { surfaceForPath } from "@/lib/channel";

/**
 * Picks the whole shell for the surface being viewed, not just its links.
 * Business gets its own header, footer and light theme; Express and Operations
 * keep the dark consumer chrome. `data-surface` is what re-points the design
 * tokens in globals.css, so every shared component below follows.
 */
export default function ChannelChrome({ children }: { children: React.ReactNode }) {
  const surface = surfaceForPath(usePathname() ?? "/");
  const business = surface === "business";

  return (
    <div data-surface={surface} className="flex min-h-dvh flex-1 flex-col">
      <SkipLink />
      {business ? <BusinessNav /> : <Navbar channel={surface} />}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {business ? <BusinessFooter /> : <Footer channel={surface} />}
      {surface === "express" ? <CartDrawer /> : null}
      {/* Operations staff have the data directly; the assistant is for
          customers and buyers. */}
      {surface === "operations" ? null : <AssistantWidget channel={surface} />}
      <AuthModal />
      <ToastHost />
    </div>
  );
}
