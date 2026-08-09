"use client";

import Link from "next/link";
import { businessHref, expressHref } from "@/lib/channel";

const COLUMNS = [
  {
    title: "For buyers",
    links: [
      { label: "Browse suppliers", href: businessHref("/suppliers") },
      { label: "Wholesale catalogue", href: businessHref("/catalogue") },
      { label: "Post an RFQ", href: businessHref("/rfqs") },
      { label: "Protected Trade", href: businessHref("/assurance") },
    ],
  },
  {
    title: "For suppliers",
    links: [
      { label: "Sourcing opportunities", href: businessHref("/opportunities") },
      { label: "Become a supplier", href: expressHref("/sell") },
      { label: "Verification", href: businessHref("/assurance#verification") },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "How matching works", href: businessHref("/assurance#matching") },
      { label: "Dispute and refund policy", href: businessHref("/assurance#disputes") },
      { label: "Messages", href: "/messages" },
    ],
  },
];

export default function BusinessFooter() {
  return (
    <footer className="border-t border-[var(--b-line)] bg-white">
      <div className="mx-auto grid max-w-[var(--container-wide)] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div className="max-w-[340px]">
          <p className="text-[1.02rem] font-bold tracking-[0.14em] text-[var(--b-navy)]">AURION</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[0.55rem] tracking-[0.3em] text-[var(--b-brand)]">
            BUSINESS
          </p>
          <p className="mt-4 text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
            A commercial sourcing platform for Ethiopian-origin goods, from structured requirement through supplier
            selection, contract, inspection, and settlement.
          </p>
          <Link
            href={expressHref("/")}
            className="mt-5 inline-flex text-[0.8rem] font-semibold text-[var(--b-navy)] underline underline-offset-4"
          >
            Looking to buy retail? Visit AURION Express
          </Link>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="b-eyebrow">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[0.85rem] text-[var(--text-secondary)] hover:text-[var(--b-navy)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[var(--b-line)]">
        <div className="mx-auto flex max-w-[var(--container-wide)] flex-col gap-2 px-4 py-5 text-[0.72rem] text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AURION Global Holdings PLC. Headquartered in Addis Ababa.</p>
          <p>
            Protected Trade holds funds through a licensed payment provider. Provider status is shown on every trade
            record.
          </p>
        </div>
      </div>
    </footer>
  );
}
