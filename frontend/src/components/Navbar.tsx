"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Bag, User, List, X } from "@phosphor-icons/react";
import { useMe, useLogout } from "@/lib/auth";
import { useInbox } from "@/lib/messages";
import { useCartStore, cartItemCount } from "@/store/cart";
import { useUiStore } from "@/store/ui";

export default function Navbar() {
  const pathname = usePathname();
  const { data: user } = useMe();
  const logout = useLogout();
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const { data: inbox } = useInbox(!!user);
  const unreadMessages = inbox?.unreadTotal ?? 0;
  const openAuth = useUiStore((s) => s.openAuth);
  const showToast = useUiStore((s) => s.showToast);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const count = cartItemCount(items);

  function closeNavigation() {
    setMobileOpen(false);
    setDropdownOpen(false);
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/store", label: "Marketplace" },
    { href: "/source", label: "Source at Scale" },
    { href: "/#story", label: "Our Story" },
    ...(user?.role === "vendor" ? [{ href: "/vendor", label: "Vendor" }] : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className={`fixed top-3 left-3 right-3 z-[1000] transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] rounded-2xl border ${
        scrolled
          ? "bg-[rgba(5,7,13,0.94)] border-[var(--border-gold)] shadow-[0_18px_60px_rgba(0,0,0,0.42)]"
          : "bg-[rgba(5,7,13,0.72)] border-white/[0.08]"
      } backdrop-blur-2xl`}
    >
      <div className="max-w-[var(--container-wide)] mx-auto flex items-center justify-between h-[72px] px-3 sm:px-5 gap-3">
        <Link
          href="/"
          className="group flex items-center gap-2.5 shrink-0 min-h-11"
          aria-label="AURION Markets home"
          onClick={closeNavigation}
        >
          <span className="relative w-11 h-11 shrink-0 transition-transform duration-300 ease-[var(--ease-out)] group-hover:rotate-[4deg]">
            <Image
              src="/brand/aurion-emblem.png"
              alt=""
              fill
              sizes="44px"
              className="object-contain"
              priority
            />
          </span>
          <span className="leading-none">
            <span className="block font-[family-name:var(--font-display)] text-[1.25rem] sm:text-[1.35rem] font-semibold tracking-[0.12em] text-[var(--gold-pale)]">
              AURION
            </span>
            <span className="block mt-1 font-[family-name:var(--font-mono)] text-[0.52rem] tracking-[0.34em] text-[var(--gold)]">
              MARKETS
            </span>
          </span>
        </Link>

        <ul
          className={`${
            mobileOpen ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row gap-1 lg:gap-1.5 items-stretch lg:items-center absolute lg:static top-[80px] left-0 right-0 lg:top-auto bg-[rgba(5,7,13,0.98)] lg:bg-transparent p-3 lg:p-0 border border-[var(--border-gold)] lg:border-0 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none lg:flex-1 lg:justify-center`}
        >
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={closeNavigation}
                className={`flex min-h-11 items-center rounded-xl px-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-[color,background-color] duration-200 ${
                  pathname === l.href
                    ? "bg-white/[0.055] text-[var(--gold-light)]"
                    : "text-[var(--text-secondary)] hover:bg-white/[0.035] hover:text-[var(--gold-light)]"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/source"
            onClick={closeNavigation}
            className="hidden xl:inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-gold-strong)] px-4 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)] transition-colors hover:bg-[var(--gold)] hover:text-[var(--bg-deep)]"
          >
            Request a quote <ArrowUpRight size={14} />
          </Link>
          <button
            className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--gold)]"
            aria-label="Open cart"
            onClick={openCart}
          >
            <Bag size={22} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-[var(--gold)] text-[var(--bg-deep)] text-[0.6rem] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center font-[family-name:var(--font-mono)]">
                {count}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              className="w-11 h-11 cursor-pointer rounded-full border border-[var(--border-gold)] bg-[rgba(214,180,94,0.08)] flex items-center justify-center text-sm font-semibold text-[var(--gold)] transition-colors hover:bg-[rgba(214,180,94,0.15)]"
              onClick={() => setDropdownOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={dropdownOpen}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </button>
            {/* Always mounted so it can animate both in and out; grows from the
                top-right (its anchor), not the center. */}
            <div
              aria-hidden={!dropdownOpen}
              inert={!dropdownOpen}
              className={`absolute top-14 right-0 bg-[rgba(10,15,26,0.98)] backdrop-blur-xl border border-[var(--border-gold)] rounded-xl py-2 min-w-[200px] shadow-2xl origin-top-right transition-[transform,opacity] duration-150 ease-[var(--ease-out)] ${
                dropdownOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-[0.97] pointer-events-none"
              }`}
            >
              {user ? (
                  <>
                    <Link
                      href="/account"
                      className="flex min-h-11 items-center px-5 text-sm text-[var(--text-secondary)] hover:bg-[rgba(214,180,94,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="flex min-h-11 items-center px-5 text-sm text-[var(--text-secondary)] hover:bg-[rgba(214,180,94,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/messages"
                      className="flex min-h-11 items-center justify-between gap-2 px-5 text-sm text-[var(--text-secondary)] hover:bg-[rgba(214,180,94,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Messages
                      {unreadMessages > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1.5 font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--bg-deep)]">
                          {unreadMessages}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex min-h-11 items-center px-5 text-sm text-[var(--text-secondary)] hover:bg-[rgba(214,180,94,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Wishlist
                    </Link>
                    {user.role === "buyer" && (
                      <Link
                        href="/sell"
                        className="flex min-h-11 items-center px-5 text-sm text-[var(--text-secondary)] hover:bg-[rgba(214,180,94,0.08)] hover:text-[var(--gold)]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Sell on AURION
                      </Link>
                    )}
                    <hr className="border-[var(--border-subtle)] my-1" />
                    <button
                      className="w-full min-h-11 cursor-pointer text-left px-5 text-sm text-[var(--text-secondary)] hover:bg-[rgba(214,180,94,0.08)] hover:text-[var(--gold)]"
                      onClick={() => {
                        logout.mutate(undefined, {
                          onSuccess: () => showToast("Logged out.", "success"),
                        });
                        setDropdownOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full min-h-11 cursor-pointer text-left px-5 text-sm text-[var(--gold)] hover:bg-[rgba(214,180,94,0.08)]"
                      onClick={() => {
                        openAuth("login");
                        setDropdownOpen(false);
                      }}
                    >
                      Sign In
                    </button>
                    <Link
                      href="/sell"
                      className="flex min-h-11 items-center px-5 text-sm text-[var(--text-secondary)] hover:bg-[rgba(214,180,94,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Sell on AURION
                    </Link>
                  </>
                )}
            </div>
          </div>

          <button
            className="lg:hidden flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[var(--gold)] transition-colors hover:bg-white/[0.05]"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
