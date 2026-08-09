"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, CaretDown, List, ShieldCheck, X } from "@phosphor-icons/react";
import { useMe, useLogout } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { useUiStore } from "@/store/ui";
import { businessHref, expressHref, operationsHref } from "@/lib/channel";

/**
 * The Business header. Deliberately nothing like the Express nav: a solid
 * trade-desk bar with a utility strip, section navigation and a standing
 * "Post an RFQ" action, rather than the floating consumer pill.
 */
export default function BusinessNav() {
  const pathname = usePathname() ?? "/";
  const { data: user } = useMe();
  const logout = useLogout();
  const openAuth = useUiStore((state) => state.openAuth);
  const showToast = useUiStore((state) => state.showToast);
  const notifications = useNotifications(!!user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const unread = (notifications.data ?? []).filter((item) => !item.readAt).length;

  const links = [
    { href: businessHref("/"), label: "Overview" },
    { href: businessHref("/suppliers"), label: "Suppliers" },
    { href: businessHref("/catalogue"), label: "Wholesale catalogue" },
    { href: businessHref("/rfqs"), label: "RFQ workspace" },
    ...(user?.role === "vendor" ? [{ href: businessHref("/opportunities"), label: "Opportunities" }] : []),
    { href: businessHref("/assurance"), label: "Protected Trade" },
  ];

  const isCurrent = (href: string) => {
    const path = href.startsWith("http") ? new URL(href).pathname : href;
    const root = businessHref("/");
    if (path === root) return pathname === root;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-[900]">
      <div className="bg-[var(--b-navy)] text-[var(--b-navy-ink)]">
        <div className="mx-auto flex h-9 max-w-[var(--container-wide)] items-center justify-between gap-4 px-4 text-[0.68rem] sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 truncate">
            <ShieldCheck size={13} weight="fill" className="shrink-0 opacity-80" />
            <span className="truncate">
              AURION Protected Trade, verified supplier network, structured RFQ workflow
            </span>
          </p>
          <nav aria-label="AURION products" className="hidden shrink-0 items-center gap-4 sm:flex">
            {user?.role === "admin" || user?.role === "vendor" ? (
              <a className="opacity-80 hover:opacity-100" href={operationsHref("/admin")}>
                Operations
              </a>
            ) : null}
            <a className="opacity-80 hover:opacity-100" href={expressHref("/")}>
              AURION Express
            </a>
          </nav>
        </div>
      </div>

      <div className="border-b border-[var(--b-line)] bg-white">
        <div className="mx-auto flex h-16 max-w-[var(--container-wide)] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href={businessHref("/")}
            className="flex shrink-0 items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <span className="relative h-8 w-8">
              <Image src="/brand/aurion-emblem.png" alt="" fill sizes="32px" className="object-contain" priority />
            </span>
            <span className="leading-none">
              <span className="block text-[1.02rem] font-bold tracking-[0.14em] text-[var(--b-navy)]">AURION</span>
              <span className="mt-[3px] block font-[family-name:var(--font-mono)] text-[0.55rem] tracking-[0.3em] text-[var(--b-brand)]">
                BUSINESS
              </span>
            </span>
          </Link>

          <nav aria-label="Business sections" className="hidden flex-1 items-center gap-0.5 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={`flex min-h-9 items-center rounded-[6px] px-3 text-[0.8rem] font-semibold transition-colors ${
                  isCurrent(link.href)
                    ? "bg-[var(--b-tint)] text-[var(--b-navy)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--b-tint)] hover:text-[var(--b-navy)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link
                href={businessHref("/rfqs")}
                aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
                className="relative flex h-9 w-9 items-center justify-center rounded-[6px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--b-tint)]"
              >
                <Bell size={18} />
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--b-navy)] px-1 font-[family-name:var(--font-mono)] text-[0.55rem] text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
            ) : null}

            <div className="relative">
              <button
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[var(--b-line)] px-2.5 text-[0.78rem] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--b-tint)]"
              >
                {user ? user.name.split(" ")[0] : "Sign in"}
                <CaretDown size={12} />
              </button>
              <div
                aria-hidden={!accountOpen}
                inert={!accountOpen}
                className={`absolute right-0 top-11 min-w-[190px] origin-top-right rounded-[8px] border border-[var(--b-line)] bg-white py-1.5 shadow-[0_12px_34px_rgba(11,37,69,0.14)] transition-[opacity,transform] duration-150 ${
                  accountOpen ? "scale-100 opacity-100" : "pointer-events-none scale-[0.97] opacity-0"
                }`}
              >
                {user ? (
                  <>
                    <MenuLink href="/account" onClick={() => setAccountOpen(false)}>
                      Account
                    </MenuLink>
                    <MenuLink href={businessHref("/rfqs")} onClick={() => setAccountOpen(false)}>
                      RFQ workspace
                    </MenuLink>
                    <MenuLink href="/messages" onClick={() => setAccountOpen(false)}>
                      Messages
                    </MenuLink>
                    <hr className="my-1 border-[var(--b-line)]" />
                    <button
                      className="w-full cursor-pointer px-4 py-2 text-left text-[0.82rem] text-[var(--text-secondary)] hover:bg-[var(--b-tint)]"
                      onClick={() => {
                        logout.mutate(undefined, { onSuccess: () => showToast("Signed out.", "success") });
                        setAccountOpen(false);
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full cursor-pointer px-4 py-2 text-left text-[0.82rem] font-semibold text-[var(--b-navy)] hover:bg-[var(--b-tint)]"
                    onClick={() => {
                      openAuth("login");
                      setAccountOpen(false);
                    }}
                  >
                    Sign in to source
                  </button>
                )}
              </div>
            </div>

            <Link href={businessHref("/rfqs")} className="btn btn-primary hidden sm:inline-flex">
              Post an RFQ
            </Link>

            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[6px] text-[var(--b-navy)] hover:bg-[var(--b-tint)] lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav aria-label="Business sections" className="border-t border-[var(--b-line)] bg-white px-4 py-2 lg:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center rounded-[6px] px-2 text-[0.85rem] font-semibold text-[var(--text-secondary)] hover:bg-[var(--b-tint)]"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={expressHref("/")}
              className="flex min-h-11 items-center rounded-[6px] px-2 text-[0.85rem] font-semibold text-[var(--text-muted)]"
            >
              AURION Express
            </a>
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-[0.82rem] text-[var(--text-secondary)] hover:bg-[var(--b-tint)] hover:text-[var(--b-navy)]"
    >
      {children}
    </Link>
  );
}
