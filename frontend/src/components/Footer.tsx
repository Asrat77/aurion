import Link from "next/link";
import { MapPin, Phone, EnvelopeSimple } from "@phosphor-icons/react/ssr";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] px-4 md:px-8 pt-12 pb-8 bg-[var(--bg-surface)]">
      <div className="max-w-[var(--container-wide)] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-[family-name:var(--font-display)] text-xl text-[var(--gold)] tracking-wide">
            AURION GLOBAL HOLDINGS PLC
          </div>
          <p className="mt-2 text-[var(--text-muted)] text-sm leading-loose">
            Ethiopian-origin multinational conglomerate building integrated engines of
            value across technology, commerce, and industry, driving prosperity from
            Ethiopia to the world.
          </p>
          <div className="flex flex-col gap-1.5 mt-3 text-[var(--text-muted)] text-sm leading-loose">
            <span className="flex items-start gap-2">
              <MapPin size={14} className="mt-1 shrink-0" />
              Bole Road, Kirkos Sub-City, Addis Ababa, Ethiopia
            </span>
            <span className="flex items-center gap-2">
              <Phone size={14} className="shrink-0" /> +251 11 7 123456
            </span>
            <span className="flex items-center gap-2">
              <EnvelopeSimple size={14} className="shrink-0" /> info@aurionglobal.com
            </span>
          </div>
        </div>
        <div>
          <h4 className="font-[family-name:var(--font-display)] text-white mb-3">Company</h4>
          <FooterLink href="/">Home</FooterLink>
          <FooterLink href="/store">Marketplace</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
        </div>
        <div>
          <h4 className="font-[family-name:var(--font-display)] text-white mb-3">Products</h4>
          <FooterLink href="/store?category=coffee">Coffee</FooterLink>
          <FooterLink href="/store?category=teff">Teff &amp; Grains</FooterLink>
          <FooterLink href="/store?category=jewelry">Jewelry</FooterLink>
          <FooterLink href="/store?category=spices">Spices &amp; Honey</FooterLink>
        </div>
        <div>
          <h4 className="font-[family-name:var(--font-display)] text-white mb-3">Governance</h4>
          <FooterLink href="/contact">Privacy Policy</FooterLink>
          <FooterLink href="/contact">Terms of Use</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
        </div>
      </div>
      <div className="max-w-[var(--container-wide)] mx-auto mt-8 pt-6 border-t border-[var(--border-subtle)] text-center text-[var(--text-muted)] text-xs">
        © {new Date().getFullYear()} AURION GLOBAL HOLDINGS PLC. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block text-[var(--text-muted)] text-sm leading-loose hover:text-[var(--gold)]"
    >
      {children}
    </Link>
  );
}
