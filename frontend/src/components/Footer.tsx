import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-subtle)] px-4 md:px-8 pt-16 pb-8 bg-[var(--bg-surface)]">
      <div className="absolute inset-0 aurion-pattern opacity-[0.12] pointer-events-none" />
      <div className="relative max-w-[var(--container-wide)] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-12">
        <div className="max-w-[520px]">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="AURION Markets home">
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
            Ethiopian origin, presented with clarity and connected to buyers at retail and
            commercial scale.
          </p>
          <Link href="/source" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)] hover:text-white">
            Start a sourcing request <ArrowUpRight size={16} />
          </Link>
        </div>
        <div>
          <div className="section-label mb-4">
            Explore
          </div>
          <FooterLink href="/">Home</FooterLink>
          <FooterLink href="/store">Marketplace</FooterLink>
          <FooterLink href="/source">Source at Scale</FooterLink>
          <FooterLink href="/#story">Our Story</FooterLink>
          <FooterLink href="/sell">Sell on AURION</FooterLink>
          <FooterLink href="/buyer-protection">Buyer Protection</FooterLink>
        </div>
        <div>
          <div className="section-label mb-4">Origins</div>
          <FooterLink href="/store?category=coffee">Coffee</FooterLink>
          <FooterLink href="/store?category=teff">Teff &amp; Grains</FooterLink>
          <FooterLink href="/store?category=jewelry">Jewelry</FooterLink>
          <FooterLink href="/store?category=spices">Spices &amp; Honey</FooterLink>
        </div>
      </div>
      <div className="relative max-w-[var(--container-wide)] mx-auto mt-12 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row gap-2 justify-between text-[var(--text-muted)] text-xs">
        <span>© {new Date().getFullYear()} AURION GLOBAL HOLDINGS PLC.</span>
        <span>From Ethiopia to global markets.</span>
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
