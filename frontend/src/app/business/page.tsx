"use client";

import Link from "next/link";
import {
  ArrowRight,
  Buildings,
  ClipboardText,
  Handshake,
  MagnifyingGlass,
  SealCheck,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react";
import { useNetworkSnapshot, useSupplierDirectory } from "@/lib/businessNetwork";
import { businessHref } from "@/lib/channel";
import { formatMoney } from "@/lib/money";
import { Skeleton } from "@/components/ui/Skeleton";
import SupplierCard from "@/components/business/SupplierCard";
import ProtectionNotice from "@/components/business/ProtectionNotice";

const FLOW = [
  {
    icon: ClipboardText,
    step: "01",
    title: "Post a structured requirement",
    body: "One RFQ carries products, quantities, destination, Incoterm, and whether pre-shipment inspection is required.",
  },
  {
    icon: MagnifyingGlass,
    step: "02",
    title: "Suppliers are matched and scored",
    body: "A deterministic scorer ranks eligible verified suppliers and invites the top five. Every point is shown to you.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Compare competing offers",
    body: "Submitted quotations are immutable. Compare price, lead time and terms, then accept exactly one.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Trade against a protected record",
    body: "Contract digest, funding, inspection, shipment, delivery and dispute all resolve against one auditable trade.",
  },
];

export default function BusinessHome() {
  const network = useNetworkSnapshot();
  const directory = useSupplierDirectory({ verified: true });
  const snapshot = network.data;

  return (
    <>
      <section className="border-b border-[var(--b-line)] bg-white">
        <div className="mx-auto grid max-w-[var(--container-wide)] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-20 lg:px-8">
          <div>
            <span className="b-chip b-chip-navy">
              <Buildings size={13} weight="fill" /> B2B sourcing platform
            </span>
            <h1 className="display-hero mt-5 max-w-[620px]">
              Source Ethiopian goods at scale, on terms you can audit.
            </h1>
            <p className="mt-5 max-w-[580px] text-[0.98rem] leading-[1.75] text-[var(--text-secondary)]">
              AURION Business connects buyers with verified Ethiopian suppliers through structured requests for
              quotation, scored supplier matching, competing offers, and a protected trade record that follows the
              order from contract to settlement.
            </p>

            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Link href={businessHref("/rfqs")} className="btn btn-primary inline-flex items-center justify-center gap-2">
                Post a request for quotation <ArrowRight size={15} />
              </Link>
              <Link href={businessHref("/suppliers")} className="btn btn-outline inline-flex items-center justify-center gap-2">
                Browse verified suppliers
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-[var(--b-line)] pt-7 sm:grid-cols-4">
              <Metric
                label="Verified suppliers"
                value={snapshot ? `${snapshot.suppliers.verified}` : null}
                hint={snapshot ? `${snapshot.suppliers.total} onboarded` : undefined}
                loading={network.isLoading}
              />
              <Metric
                label="Wholesale SKUs"
                value={snapshot ? `${snapshot.catalogue.products}` : null}
                hint={snapshot ? `${snapshot.catalogue.categories.length} categories` : undefined}
                loading={network.isLoading}
              />
              <Metric
                label="Open requirements"
                value={snapshot ? `${snapshot.sourcing.openRequests}` : null}
                hint={snapshot ? `${snapshot.sourcing.invitationsSent} invitations sent` : undefined}
                loading={network.isLoading}
              />
              <Metric
                label="Median response"
                value={snapshot?.sourcing.medianResponseHours != null ? `${snapshot.sourcing.medianResponseHours}h` : null}
                hint="From invitation to reply"
                loading={network.isLoading}
              />
            </dl>
            {/* Metrics come from the database at request time. Anything not yet
                measured is shown as such rather than filled with a placeholder. */}
            <p className="mt-4 text-[0.72rem] text-[var(--text-muted)]">
              Live platform figures, measured
              {snapshot ? ` ${new Date(snapshot.measuredAt).toLocaleString()}` : ""}. Metrics with no recorded activity
              read &ldquo;not measured yet&rdquo;.
            </p>
          </div>

          <aside className="lg:pl-4">
            <ProtectionNotice protection={snapshot?.protection} />

            <div className="b-panel mt-4">
              <div className="b-panel-head">
                <span className="b-panel-title">Trade pipeline</span>
                <span className="b-eyebrow">Live</span>
              </div>
              <div className="divide-y divide-[var(--b-line)]">
                <PipelineRow
                  icon={<ClipboardText size={16} />}
                  label="Requirements matched"
                  value={snapshot ? snapshot.sourcing.requestsMatched : null}
                />
                <PipelineRow
                  icon={<Handshake size={16} />}
                  label="Quotations submitted"
                  value={snapshot ? snapshot.sourcing.quotationsSubmitted : null}
                />
                <PipelineRow
                  icon={<Truck size={16} />}
                  label="Trades in progress"
                  value={snapshot ? snapshot.trades.active : null}
                />
                <PipelineRow
                  icon={<SealCheck size={16} />}
                  label="Trades settled"
                  value={snapshot ? snapshot.trades.completed : null}
                />
                <PipelineRow
                  icon={<ShieldCheck size={16} />}
                  label="Value under protection"
                  value={
                    snapshot
                      ? snapshot.trades.protectedCents > 0
                        ? formatMoney(snapshot.trades.protectedCents, snapshot.trades.currency)
                        : "None held"
                      : null
                  }
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-[var(--b-line)] bg-[var(--bg-deep)]">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="b-eyebrow">Sourcing categories</p>
              <h2 className="display-title mt-2">What the network can supply today</h2>
            </div>
            <Link href={businessHref("/catalogue")} className="b-link text-[0.85rem]">
              View the wholesale catalogue
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {network.isLoading
              ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-[104px] w-full" />)
              : snapshot?.catalogue.categories.length
                ? snapshot.catalogue.categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`${businessHref("/catalogue")}?category=${category.slug}`}
                      className="b-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--border-gold-strong)]"
                    >
                      <div>
                        <p className="text-[0.95rem] font-semibold text-[var(--text-primary)]">{category.name}</p>
                        <p className="mt-1 text-[0.78rem] text-[var(--text-muted)]">
                          {category.suppliers} {category.suppliers === 1 ? "supplier" : "suppliers"} ·{" "}
                          {category.products} {category.products === 1 ? "product" : "products"}
                        </p>
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-[var(--b-navy)]" />
                    </Link>
                  ))
                : (
                    <p className="text-[0.85rem] text-[var(--text-secondary)]">
                      No supplier has enabled a product for Business sourcing yet.
                    </p>
                  )}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--b-line)] bg-white">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-14 sm:px-6 lg:px-8">
          <p className="b-eyebrow">How a trade runs</p>
          <h2 className="display-title mt-2 max-w-[540px]">Four stages, each leaving evidence behind.</h2>

          <ol className="mt-9 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--b-line)] bg-[var(--b-line)] lg:grid-cols-4">
            {FLOW.map(({ icon: Icon, step, title, body }) => (
              <li key={step} className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <Icon size={22} className="text-[var(--b-navy)]" />
                  <span className="b-eyebrow">{step}</span>
                </div>
                <h3 className="mt-6 text-[0.98rem] font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-2 text-[0.83rem] leading-relaxed text-[var(--text-secondary)]">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[var(--bg-deep)]">
        <div className="mx-auto max-w-[var(--container-wide)] px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="b-eyebrow">Verified suppliers</p>
              <h2 className="display-title mt-2">Organizations an administrator has verified</h2>
            </div>
            <Link href={businessHref("/suppliers")} className="b-link text-[0.85rem]">
              Open the full directory
            </Link>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {directory.isLoading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-[200px] w-full" />)
              : directory.data?.suppliers.length
                ? directory.data.suppliers.slice(0, 6).map((supplier) => (
                    <SupplierCard key={supplier.id} supplier={supplier} />
                  ))
                : (
                    <div className="b-panel p-8 text-[0.85rem] text-[var(--text-secondary)] md:col-span-2 xl:col-span-3">
                      No supplier organization has completed verification yet. Unverified suppliers are never shown as
                      verified.
                    </div>
                  )}
          </div>

          <div className="b-panel mt-8 flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[1.05rem] font-semibold text-[var(--text-primary)]">
                Ready to put a requirement in front of them?
              </h3>
              <p className="mt-1.5 text-[0.85rem] text-[var(--text-secondary)]">
                Create a buyer organization, publish an RFQ, and watch the shortlist form with its scores explained.
              </p>
            </div>
            <Link href={businessHref("/rfqs")} className="btn btn-primary inline-flex shrink-0 items-center justify-center gap-2">
              Open the RFQ workspace <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: string | null;
  hint?: string;
  loading: boolean;
}) {
  return (
    <div>
      <dt className="b-eyebrow">{label}</dt>
      <dd className="mt-2">
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : value ? (
          <span className="b-figure">{value}</span>
        ) : (
          <span className="text-[0.85rem] text-[var(--text-muted)]">Not measured yet</span>
        )}
      </dd>
      {hint ? <p className="mt-1 text-[0.72rem] text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

function PipelineRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className="flex items-center gap-2.5 text-[0.85rem] text-[var(--text-secondary)]">
        <span className="text-[var(--b-navy)]">{icon}</span>
        {label}
      </span>
      {value === null ? (
        <Skeleton className="h-4 w-10" />
      ) : (
        <span className="font-[family-name:var(--font-mono)] text-[0.85rem] text-[var(--text-primary)]">{value}</span>
      )}
    </div>
  );
}
