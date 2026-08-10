"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { useProducts } from "@/lib/products";
import { businessHref } from "@/lib/channel";
import { formatMoney } from "@/lib/money";
import { Skeleton } from "@/components/ui/Skeleton";
import ProductImage from "@/components/ui/ProductImage";
import type { Product } from "@/types";

export default function BusinessCataloguePage() {
  return (
    <Suspense fallback={<CatalogueSkeleton />}>
      <Catalogue />
    </Suspense>
  );
}

function Catalogue() {
  const params = useSearchParams();
  const category = params.get("category") ?? undefined;
  const supplier = params.get("supplier") ?? undefined;
  const catalogue = useProducts({ channel: "business", category, vendor: supplier });
  const products = catalogue.data?.products ?? [];

  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--b-line)] pb-7">
        <div>
          <p className="b-eyebrow">Wholesale catalogue</p>
          <h1 className="display-title mt-2">Products enabled for commercial sourcing</h1>
          <p className="mt-2.5 max-w-[580px] text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
            Minimum order quantities, volume breaks and lead times as published by the supplier. Attach any line to a
            structured RFQ to receive competing offers.
          </p>
        </div>
        <Link href={businessHref("/rfqs")} className="btn btn-primary inline-flex items-center gap-2">
          Post an RFQ <ArrowRight size={15} />
        </Link>
      </div>

      {category || supplier ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {category ? <span className="b-chip b-chip-accent">Category: {category}</span> : null}
          {supplier ? <span className="b-chip b-chip-accent">Supplier: {supplier}</span> : null}
          <Link href={businessHref("/catalogue")} className="b-link text-[0.8rem]">
            Clear
          </Link>
        </div>
      ) : null}

      {catalogue.isLoading ? (
        <CatalogueSkeleton />
      ) : products.length ? (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <WholesaleCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="b-panel mt-7 p-10 text-center text-[0.88rem] text-[var(--text-secondary)]">
          No wholesale product matches. You can still describe a custom requirement in the RFQ workspace.
        </div>
      )}
    </section>
  );
}

function WholesaleCard({ product }: { product: Product }) {
  const terms = product.wholesale;

  return (
    <article className="b-panel flex h-full flex-col overflow-hidden">
      <div className="aspect-[16/10] overflow-hidden border-b border-[var(--b-line)]">
        <ProductImage
          name={product.name}
          emoji={product.emoji}
          width={640}
          height={400}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
          frame={false}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="b-eyebrow">{product.category.name}</p>
        <h2 className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-[var(--text-primary)]">{product.name}</h2>
        <p className="mt-1 text-[0.76rem] text-[var(--text-muted)]">{product.vendor?.storeName}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[var(--b-line)] pt-3.5">
          <Term label="Indicative unit" value={formatMoney(product.priceCents, product.currency)} />
          <Term label="MOQ" value={terms?.moq ? `${terms.moq} ${terms.unitOfMeasure ?? ""}`.trim() : "On request"} />
          <Term label="Lead time" value={terms?.leadTimeDays ? `${terms.leadTimeDays} days` : "On request"} />
          <Term label="Sample" value={terms?.sampleAvailable ? "Available" : "Not offered"} />
        </dl>

        {terms?.priceTiers?.length ? (
          <div className="mt-3.5 rounded-[var(--radius-md)] bg-[var(--b-tint)] p-3">
            <p className="b-eyebrow">Volume breaks</p>
            <ul className="mt-2 space-y-1">
              {terms.priceTiers.slice(0, 3).map((tier) => (
                <li
                  key={tier.minQuantity}
                  className="flex justify-between font-[family-name:var(--font-mono)] text-[0.74rem] text-[var(--text-secondary)]"
                >
                  <span>{tier.minQuantity}+</span>
                  <span>{formatMoney(tier.unitPriceCents, product.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto pt-4">
          <Link
            href={`${businessHref("/rfqs")}?product=${product.id}`}
            className="btn btn-outline w-full text-center"
          >
            Request a quotation
          </Link>
        </div>
      </div>
    </article>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="b-eyebrow">{label}</dt>
      <dd className="mt-1 text-[0.82rem] text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[380px] w-full" />
      ))}
    </div>
  );
}
