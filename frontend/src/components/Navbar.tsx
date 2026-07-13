"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bag, User, List, X } from "@phosphor-icons/react";
import { useMe, useLogout } from "@/lib/auth";
import { useCartStore, cartItemCount } from "@/store/cart";
import { useUiStore } from "@/store/ui";

export default function Navbar() {
  const { data: user } = useMe();
  const logout = useLogout();
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const openAuth = useUiStore((s) => s.openAuth);
  const showToast = useUiStore((s) => s.showToast);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const count = cartItemCount(items);

  const links = [
    { href: "/", label: "Home" },
    { href: "/store", label: "Store" },
    ...(user?.role === "vendor" ? [{ href: "/vendor", label: "Vendor" }] : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] border-b transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out)] px-4 md:px-8 ${
        scrolled
          ? "bg-[rgba(10,10,12,0.96)] border-[var(--border-gold)]"
          : "bg-[rgba(10,10,12,0.85)] border-[var(--border-subtle)]"
      } backdrop-blur-xl`}
    >
      <div className="max-w-[var(--container-wide)] mx-auto flex items-center justify-between h-[72px] gap-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--gold)] flex items-center gap-2.5 shrink-0"
        >
          <span className="w-9 h-9 border-2 border-[var(--gold)] rounded-full flex items-center justify-center text-sm font-bold font-[family-name:var(--font-mono)]">
            A
          </span>
          AURION
        </Link>

        <ul
          className={`${
            mobileOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row gap-6 items-center absolute md:static top-[72px] left-0 right-0 md:top-auto bg-[rgba(10,10,12,0.98)] md:bg-transparent p-8 md:p-0 border-b md:border-0 border-[var(--border-subtle)] md:flex-1`}
        >
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wide hover:text-[var(--gold)] transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 shrink-0">
          <button
            className="relative text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors"
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
              className="w-8 h-8 rounded-full border border-[var(--border-gold)] bg-[var(--border-gold)] flex items-center justify-center text-sm font-semibold text-[var(--gold)]"
              onClick={() => setDropdownOpen((o) => !o)}
              aria-label="Account menu"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </button>
            {/* Always mounted so it can animate both in and out; grows from the
                top-right (its anchor), not the center. */}
            <div
              className={`absolute top-11 right-0 bg-[var(--bg-surface)] border border-[var(--border-gold)] rounded-lg py-2 min-w-[180px] shadow-2xl origin-top-right transition-[transform,opacity] duration-150 ease-[var(--ease-out)] ${
                dropdownOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-[0.97] pointer-events-none"
              }`}
            >
              {user ? (
                  <>
                    <Link
                      href="/account"
                      className="block px-5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(200,164,92,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(200,164,92,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className="block px-5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(200,164,92,0.08)] hover:text-[var(--gold)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Wishlist
                    </Link>
                    <hr className="border-[var(--border-subtle)] my-1" />
                    <button
                      className="w-full text-left px-5 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgba(200,164,92,0.08)] hover:text-[var(--gold)]"
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
                  <button
                    className="w-full text-left px-5 py-2 text-sm text-[var(--gold)] hover:bg-[rgba(200,164,92,0.08)]"
                    onClick={() => {
                      openAuth("login");
                      setDropdownOpen(false);
                    }}
                  >
                    Sign In
                  </button>
                )}
            </div>
          </div>

          <button
            className="md:hidden flex items-center justify-center p-2 text-[var(--gold)]"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
