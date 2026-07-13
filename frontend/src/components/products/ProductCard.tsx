"use client";

import Link from "next/link";
import { Heart, Star, MapPin, Storefront, Check } from "@phosphor-icons/react";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUiStore } from "@/store/ui";
import ProductImage from "@/components/ui/ProductImage";

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const showToast = useUiStore((s) => s.showToast);

  const inCart = cartItems.some((i) => i.productId === product.id);
  const inWishlist = wishlistIds.includes(product.id);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 flex flex-col transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-out)] [@media(hover:hover)]:hover:border-[var(--border-gold)] [@media(hover:hover)]:hover:shadow-[var(--shadow-gold)] [@media(hover:hover)]:hover:-translate-y-1">
      <div className="relative w-full aspect-[4/3] mb-4">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0">
          <ProductImage
            name={product.name}
            emoji={product.emoji}
            width={800}
            height={600}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </Link>
        <button
          className={`absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm p-1.5 rounded-full transition-colors ${
            inWishlist ? "text-[var(--gold)]" : "text-[var(--text-muted)]"
          }`}
          onClick={() => {
            const nowIn = toggleWishlist(product.id);
            showToast(nowIn ? "Added to wishlist" : "Removed from wishlist", "success");
          }}
          aria-label="Toggle wishlist"
        >
          <Heart size={18} weight={inWishlist ? "fill" : "regular"} />
        </button>
      </div>

      <span className="text-xs text-[var(--gold)] uppercase tracking-wide font-semibold">
        {product.category.name}
      </span>
      <Link href={`/product/${product.slug}`}>
        <h4 className="font-[family-name:var(--font-display)] text-lg text-white mb-1 mt-1 hover:text-[var(--gold)]">
          {product.name}
        </h4>
      </Link>
      {product.rating != null ? (
        <div className="flex items-center gap-1 text-sm text-[var(--gold)] mb-1">
          <Star size={14} weight="fill" />
          {product.rating} ({product.reviewsCount})
        </div>
      ) : (
        <div className="text-sm text-[var(--text-muted)] mb-1">No reviews yet</div>
      )}
      <div className="text-lg font-semibold text-[var(--gold-light)] my-2">
        {formatUsd(product.priceCents)}
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mb-3">
        <span className="flex items-center gap-1">
          <MapPin size={14} /> {product.origin}
        </span>
        <span className="flex items-center gap-1">
          <Storefront size={14} /> {product.vendor.storeName}
        </span>
      </div>
      <p className="text-sm text-[var(--text-muted)] flex-1 mb-3 line-clamp-2">
        {product.description}
      </p>
      <button
        className={`w-full py-2.5 rounded-full font-semibold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-[background-color,color,transform] duration-200 ease-[var(--ease-out)] active:scale-[0.98] ${
          inCart
            ? "bg-[var(--bg-elevated)] text-[var(--gold)] border border-[var(--gold)]"
            : "bg-[var(--gold)] text-[var(--bg-deep)] [@media(hover:hover)]:hover:bg-[var(--gold-light)]"
        }`}
        onClick={() => {
          addItem(product);
          showToast(`Added ${product.name} to cart`, "success");
        }}
      >
        {inCart && <Check size={14} weight="bold" />}
        {inCart ? "In Cart" : "Add to Cart"}
      </button>
    </div>
  );
}
