"use client";

import Link from "next/link";
import { ArrowRight, ClipboardText, SealCheck, ShieldCheck, Star, Truck } from "@phosphor-icons/react/ssr";
import { useProducts } from "@/lib/products";
import { useSettings } from "@/lib/settings";
import { usePrice } from "@/lib/money";
import ProductImage from "@/components/ui/ProductImage";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

/**
 * The consumer furniture that makes Express read as a storefront rather than a
 * brand page: what shoppers rated highest, and the four promises the platform
 * can actually keep.
 *
 * Every claim below is backed by something real — the ratings come from
 * delivered orders, the shipping threshold from the pricing service, and the
 * seller and tracking lines from workflows that exist. Nothing is asserted
 * about delivery windows or payment rails the deployment has not connected.
 */
export function MostLoved() {
  // The default sort is rating first with unrated products last, so this is
  // genuinely what buyers scored highest.
  const products = useProducts({ sort: "popular" });
  const rated = (products.data?.products ?? []).filter((product) => (product.reviewsCount ?? 0) > 0).slice(0, 4);

  if (!products.isLoading && rated.length === 0) return null;

  return (
    <section className="px-4 pb-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[var(--container-wide)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">RATED BY BUYERS</p>
            <h2 className="display-title">Most loved this season.</h2>
          </div>
          <Link
            href="/store"
            className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold)] hover:text-white"
          >
            Shop everything <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.isLoading
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[340px] w-full" />)
            : rated.map((product) => <RailCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}

/**
 * A link into the product page, not a shopping control.
 *
 * The full ProductCard carries cart, wishlist and toast state. Pulling that
 * onto the prerendered home route stopped the page segment from hydrating at
 * all, and a browse rail has no business owning cart state anyway: the buying
 * decision belongs on the product page it links to.
 */
function RailCard({ product }: { product: Product }) {
  const price = usePrice();

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-[transform,border-color] duration-300 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:border-[var(--border-gold)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <ProductImage
          name={product.name}
          emoji={product.emoji}
          width={640}
          height={480}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          frame={false}
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--gold)]">
          {product.category.name}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-tight text-white">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <Star size={14} weight="fill" className="text-[var(--gold)]" />
          {product.rating?.toFixed(1)}
          <span className="text-[var(--text-muted)]">
            ({product.reviewsCount} {product.reviewsCount === 1 ? "review" : "reviews"})
          </span>
        </div>
        <p className="mt-auto pt-4 text-lg text-white">{price(product.priceCents)}</p>
      </div>
    </Link>
  );
}

export function TrustStrip() {
  const settings = useSettings();
  const price = usePrice();
  const threshold = settings.data?.freeShippingThresholdCents;

  const promises = [
    {
      icon: ShieldCheck,
      title: "Buyer protection",
      body: "Request a refund on any delivered order. Every request is reviewed and the decision is recorded.",
      href: "/buyer-protection",
    },
    {
      icon: Truck,
      title: threshold ? `Free shipping over ${price(threshold)}` : "Shipping calculated at checkout",
      body: "Shipping and any duties are quoted before you pay, never added afterwards.",
    },
    {
      icon: SealCheck,
      title: "Approved sellers only",
      body: "Every store on AURION Express is an Ethiopian producer an administrator has reviewed and approved.",
    },
    {
      icon: ClipboardText,
      title: "Tracked end to end",
      body: "Each status change is written to your order timeline, from payment through to delivery.",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-[var(--container-wide)] gap-px overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
        {promises.map(({ icon: Icon, title, body, href }) => {
          const content = (
            <>
              <Icon size={26} className="text-[var(--gold)]" />
              <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl text-white">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
            </>
          );

          return href ? (
            <Link
              key={title}
              href={href}
              className="bg-[var(--bg-card)] p-7 transition-colors hover:bg-[var(--bg-elevated)]"
            >
              {content}
            </Link>
          ) : (
            <div key={title} className="bg-[var(--bg-card)] p-7">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
