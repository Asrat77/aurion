"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-subtle)] px-4 md:px-8 pt-16 pb-8 bg-[var(--bg-surface)]">
      <div className="absolute inset-0 aurion-pattern opacity-[0.12] pointer-events-none" />
      <div className="relative max-w-[var(--container-wide)] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div className="max-w-[520px]">
          <Link href="/" className="inline-flex items-center gap-3" aria-label={t("nav.home")}>
            <span className="relative h-14 w-14">
              <Image src="/brand/aurion-emblem.png" alt="" fill sizes="56px" className="object-contain" />
            </span>
            <span>
              <span className="block font-[family-name:var(--font-display)] text-2xl text-[var(--gold-pale)] tracking-[0.12em]">
                AURION
              </span>
              <span className="block font-[family-name:var(--font-mono)] text-[0.58rem] tracking-[0.32em] text-[var(--gold)]">
                GLOBAL HOLDINGS PLC
              </span>
            </span>
          </Link>
          <p className="mt-5 text-[var(--text-secondary)] leading-loose">
            {t("footer.tagline")}
          </p>
          <Link href="/source" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)] hover:text-white">
            {t("footer.startSourcing")} <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <div className="section-label mb-4">
            {t("footer.explore")}
          </div>
          <FooterLink href="/">{t("nav.home")}</FooterLink>
          <FooterLink href="/store">{t("nav.marketplace")}</FooterLink>
          <FooterLink href="/source">{t("nav.sourceAtScale")}</FooterLink>
          <FooterLink href="/#story">{t("nav.ourStory")}</FooterLink>
          <FooterLink href="/sell">{t("nav.sellOnAurion")}</FooterLink>
          <FooterLink href="/buyer-protection">{t("footer.buyerProtection")}</FooterLink>
        </div>
        <div>
          <div className="section-label mb-4">{t("footer.origins")}</div>
          <FooterLink href="/store?category=coffee">{t("home.coffee")}</FooterLink>
          <FooterLink href="/store?category=teff">{t("home.grains")}</FooterLink>
          <FooterLink href="/store?category=jewelry">{t("home.jewelry")}</FooterLink>
          <FooterLink href="/store?category=spices">{t("home.spices")}</FooterLink>
        </div>
      </div>
      <div className="relative max-w-[var(--container-wide)] mx-auto mt-12 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row gap-2 justify-between text-[var(--text-muted)] text-xs">
        <span>© {new Date().getFullYear()} AURION GLOBAL HOLDINGS PLC.</span>
        <span>{t("footer.rights")}</span>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-10 items-center text-[var(--text-secondary)] text-sm hover:text-[var(--gold)]"
    >
      {children}
    </Link>
  );
}
