"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Storefront, Heart, Check } from "@phosphor-icons/react";
import { useProduct } from "@/lib/products";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUiStore } from "@/store/ui";
import ProductImage from "@/components/ui/ProductImage";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { formatBase } from "@/lib/money";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: product, isLoading } = useProduct(slug);

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const showToast = useUiStore((s) => s.showToast);

  if (isLoading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-content)] mx-auto">
          <DetailSkeleton />
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-content)] mx-auto">
          <EmptyState
            icon={<Storefront size={32} />}
            title="Product not found"
            body="This product may have been removed or the link is incorrect."
            action={
              <Link href="/store" className="btn btn-primary">
                Back to Store
              </Link>
            }
          />
        </div>
      </section>
    );
  }

  const inCart = cartItems.some((i) => i.productId === product.id);
  const inWishlist = wishlistIds.includes(product.id);

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--gold)] hover:underline mb-6"
        >
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative w-full aspect-[4/3]">
            <ProductImage
              name={product.name}
              emoji={product.emoji}
              width={1200}
              height={900}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          <div>
            <span className="text-xs text-[var(--gold)] uppercase tracking-wide font-semibold">
              {product.category.name}
            </span>
            <h1 className="display-title mt-2 mb-2" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)" }}>
              {product.name}
            </h1>
            {product.rating != null ? (
              <div className="flex items-center gap-1 text-sm text-[var(--gold)] mb-3">
                <Star size={16} weight="fill" />
                {product.rating} ({product.reviewsCount} reviews)
              </div>
            ) : (
              <div className="text-sm text-[var(--text-muted)] mb-3">No reviews yet</div>
            )}
            <div className="font-mono text-3xl font-semibold text-[var(--gold-light)] mb-4">
              {formatBase(product.priceCents)}
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              {product.description}
            </p>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-4 mb-6">
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-[var(--gold)]" /> Origin: {product.origin}
              </span>
              <span className="flex items-center gap-2">
                <Storefront size={16} className="text-[var(--gold)]" /> Sold by{" "}
                <span className="text-[var(--gold)]">{product.vendor.storeName}</span>
              </span>
            </div>
            <div className="flex gap-3">
              <button
                className={`btn flex-1 flex items-center justify-center gap-2 ${
                  inCart ? "btn-outline" : "btn-primary"
                }`}
                onClick={() => {
                  addItem(product);
                  showToast(`Added ${product.name} to cart`, "success");
                }}
              >
                {inCart && <Check size={16} weight="bold" />}
                {inCart ? "In Cart, Add Another" : "Add to Cart"}
              </button>
              <button
                className={`btn btn-outline flex items-center justify-center gap-2 ${
                  inWishlist ? "text-[var(--gold)] border-[var(--gold)]" : ""
                }`}
                onClick={() => {
                  const nowIn = toggleWishlist(product.id);
                  showToast(nowIn ? "Added to wishlist" : "Removed from wishlist", "success");
                }}
              >
                <Heart size={16} weight={inWishlist ? "fill" : "regular"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
