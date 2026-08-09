"use client";

import Link from "next/link";
import { ArrowRight, Buildings, Package, ShieldCheck, Spinner } from "@phosphor-icons/react";
import { useBusinessCatalogue } from "@/lib/business";
import { formatMoney } from "@/lib/money";
import ProductImage from "@/components/ui/ProductImage";

export default function BusinessCataloguePage() {
  const catalogue = useBusinessCatalogue();

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8 lg:pb-32 lg:pt-40">
      <div className="absolute inset-0 aurion-pattern opacity-[0.1]" />
      <div className="relative mx-auto max-w-[var(--container-wide)]">
        <div className="flex flex-col gap-6 border-b border-[var(--border-subtle)] pb-9 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">BUSINESS CATALOGUE</p>
            <h1 className="display-title mt-3">Wholesale-ready supply.</h1>
            <p className="mt-4 max-w-[650px] leading-relaxed text-[var(--text-secondary)]">Browse products enabled for commercial sourcing, then attach one to a structured RFQ or describe a custom requirement.</p>
          </div>
          <Link href="/workspace" className="btn btn-primary inline-flex items-center justify-center gap-2">Start an RFQ <ArrowRight size={16} /></Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-4 py-2"><Buildings size={15} className="text-[var(--gold)]" /> Verified supplier catalogue</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-4 py-2"><Package size={15} className="text-[var(--gold)]" /> MOQ and lead-time aware</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-4 py-2"><ShieldCheck size={15} className="text-[var(--gold)]" /> Protected trade workflow</span>
        </div>

        {catalogue.isLoading ? <div className="py-24 text-center text-[var(--text-muted)]"><Spinner size={28} className="mx-auto animate-spin text-[var(--gold)]" /></div> : catalogue.data?.products.length ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{catalogue.data.products.map((product) => <article key={product.id} className="overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)]"><div className="aspect-[4/3] overflow-hidden"><ProductImage name={product.name} emoji={product.emoji} width={800} height={600} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" frame={false} /></div><div className="p-5"><p className="text-xs uppercase tracking-[0.14em] text-[var(--gold)]">{product.category.name}</p><h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-white">{product.name}</h2><p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">{product.description}</p><div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4 text-sm"><div><span className="block text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Indicative unit</span><span className="mt-1 block text-white">{formatMoney(product.priceCents, product.currency)}</span></div><div><span className="block text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">MOQ</span><span className="mt-1 block text-white">{product.wholesale?.moq ?? "—"} {product.wholesale?.unitOfMeasure ?? "units"}</span></div></div><Link href={`/workspace?product=${product.id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--border-gold)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)] transition-colors hover:bg-[rgba(214,180,94,0.08)]">Use in an RFQ <ArrowRight size={15} /></Link></div></article>)}</div> : <div className="mt-10 rounded-[24px] border border-dashed border-white/[0.14] p-12 text-center text-sm text-[var(--text-secondary)]">No wholesale products are published yet. You can still create a custom RFQ from the workspace.</div>}
      </div>
    </section>
  );
}
