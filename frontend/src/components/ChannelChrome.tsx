"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastHost from "@/components/ToastHost";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/auth/AuthModal";
import SkipLink from "@/components/SkipLink";
import type { Channel } from "@/lib/channel";

export default function ChannelChrome({ channel, children }: { channel: Channel; children: React.ReactNode }) {
  const retailChrome = channel === "express";
  return (
    <>
      <SkipLink />
      <Navbar channel={channel} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer channel={channel} />
      {retailChrome ? <CartDrawer /> : null}
      <AuthModal />
      <ToastHost />
    </>
  );
}
