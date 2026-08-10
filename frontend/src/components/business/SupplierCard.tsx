"use client";

import Link from "next/link";
import { MapPin, SealCheck, WarningCircle } from "@phosphor-icons/react";
import type { DirectorySupplier } from "@/lib/businessNetwork";
import { businessHref } from "@/lib/channel";

/**
 * A directory entry. Every claim on the card is stored data: verification comes
 * from the organization record, certifications and regions from capabilities an
 * administrator has verified, and the track record from the trade tables.
 */
export default function SupplierCard({ supplier }: { supplier: DirectorySupplier }) {
  const location = [supplier.city, supplier.country].filter(Boolean).join(", ");

  return (
    <article className="b-panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[0.98rem] font-semibold text-[var(--text-primary)]">{supplier.name}</h3>
          {location ? (
            <p className="mt-1 flex items-center gap-1.5 text-[0.76rem] text-[var(--text-muted)]">
              <MapPin size={12} /> {location}
              {supplier.regions.length ? ` · ${supplier.regions.join(", ")}` : ""}
            </p>
          ) : null}
        </div>
        <span className={`b-chip shrink-0 ${supplier.verified ? "b-chip-verified" : "b-chip-pending"}`}>
          {supplier.verified ? <SealCheck size={12} weight="fill" /> : <WarningCircle size={12} />}
          {supplier.verified ? "Verified" : "Unverified"}
        </span>
      </div>

      {supplier.categories.length ? (
        <p className="mt-3 text-[0.8rem] text-[var(--text-secondary)]">{supplier.categories.join(" · ")}</p>
      ) : null}

      {supplier.certifications.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {supplier.certifications.map((certification) => (
            <span key={certification} className="b-chip">
              {certification}
            </span>
          ))}
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--b-line)] pt-3.5">
        <Stat label="SKUs" value={supplier.businessProducts} />
        <Stat label="MOQ from" value={supplier.minQuantity ?? "—"} />
        <Stat label="Lead time" value={supplier.maxLeadTimeDays ? `${supplier.maxLeadTimeDays}d` : "—"} />
      </dl>

      <dl className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Invited" value={supplier.invitations} />
        <Stat label="Quoted" value={supplier.quotationsSubmitted} />
        <Stat label="Settled" value={supplier.tradesCompleted} />
      </dl>

      <Link
        href={`${businessHref("/catalogue")}?supplier=${supplier.slug}`}
        className="btn btn-outline mt-5 w-full text-center"
      >
        View wholesale products
      </Link>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="b-eyebrow">{label}</dt>
      <dd className="mt-1 font-[family-name:var(--font-mono)] text-[0.88rem] text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
