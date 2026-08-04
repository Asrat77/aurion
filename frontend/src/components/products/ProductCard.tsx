"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Heart,
  MapPin,
  Star,
  Storefront,
} from "@phosphor-icons/react";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUiStore } from "@/store/ui";
import ProductImage from "@/components/ui/ProductImage";
import { formatBase } from "@/lib/money";

export default function ProductCard({ product }: { product: Product }) {
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const wishlistIds = useWishlistStore((state) => state.ids);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const showToast = useUiStore((state) => state.showToast);

  const inCart = cartItems.some((item) => item.productId === product.id);
  const inWishlist = wishlistIds.includes(product.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:border-[var(--border-gold)] [@media(hover:hover)]:hover:shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${product.name}`}
        >
          <ProductImage
            name={product.name}
            emoji={product.emoji}
            width={800}
            height={600}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            frame={false}
            className="transition-transform duration-700 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.035]"
          />
        </Link>

        <button
          type="button"
          className={`absolute right-3 top-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] bg-black/60 backdrop-blur-md transition-colors ${
            inWishlist ? "text-[var(--gold)]" : "text-[var(--text-muted)]"
          }`}
          onClick={() => {
            const nowIn = toggleWishlist(product.id);
            showToast(
              nowIn ? "Added to wishlist" : "Removed from wishlist",
              "success",
            );
          }}
          aria-label={
            inWishlist
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
        >
          <Heart size={19} weight={inWishlist ? "fill" : "regular"} />
        </button>

        <span className="absolute bottom-3 left-3 rounded-full border border-white/[0.12] bg-black/60 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[0.56rem] uppercase tracking-[0.16em] text-[var(--gold-light)] backdrop-blur-md">
          {product.category.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/product/${product.slug}`} className="group/title min-w-0">
            <h3 className="font-[family-name:var(--font-display)] text-[1.45rem] leading-tight text-white transition-colors group-hover/title:text-[var(--gold-light)]">
              {product.name}
            </h3>
          </Link>
          <span className="shrink-0 text-base font-semibold text-[var(--gold-light)]">
            {formatBase(product.priceCents)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.68rem] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} /> {product.origin}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Storefront size={14} />
            <span className="truncate">{product.vendor.storeName}</span>
          </span>
          {product.rating != null ? (
            <span className="inline-flex items-center gap-1 text-[var(--gold)]">
              <Star size={13} weight="fill" /> {product.rating} ({product.reviewsCount})
            </span>
          ) : null}
        </div>

        <p className="mt-4 line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
          {product.description}
        </p>

        <div className="mt-5 grid grid-cols-[1fr_48px] gap-2">
          <button
            type="button"
            className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.1em] transition-[background-color,color,transform] duration-200 ease-[var(--ease-out)] active:scale-[0.98] ${
              inCart
                ? "border border-[var(--gold)] bg-[var(--bg-elevated)] text-[var(--gold)]"
                : "bg-[var(--gold)] text-[var(--bg-deep)] [@media(hover:hover)]:hover:bg-[var(--gold-light)]"
            }`}
            onClick={() => {
              addItem(product);
              showToast(`Added ${product.name} to cart`, "success");
            }}
          >
            {inCart ? <Check size={15} weight="bold" /> : null}
            {inCart ? "In Cart" : "Add to Cart"}
          </button>
          <Link
            href={`/product/${product.slug}`}
            aria-label={`View ${product.name} details`}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-gold)] text-[var(--gold)] transition-colors hover:bg-[rgba(214,180,94,0.08)] hover:text-white"
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
