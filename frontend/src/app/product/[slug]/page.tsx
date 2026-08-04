"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Storefront,
  Heart,
  Check,
  Truck,
  ShieldCheck,
  Package,
  Minus,
  Plus,
} from "@phosphor-icons/react";
import { useProduct } from "@/lib/products";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUiStore } from "@/store/ui";
import ProductImage from "@/components/ui/ProductImage";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ProductReviews from "@/components/reviews/ProductReviews";
import ContactVendorButton from "@/components/messages/ContactVendorButton";
import { StarRating } from "@/components/reviews/StarRating";
import { formatBase } from "@/lib/money";
import type { Product } from "@/types";

// Below this, the buy box warns that stock is nearly gone.
const LOW_STOCK_THRESHOLD = 10;

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: product, isLoading } = useProduct(slug);

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

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-muted)]">
            <li>
              <Link href="/store" className="inline-flex items-center gap-1.5 text-[var(--gold)] hover:underline">
                <ArrowLeft size={16} /> Store
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/store?category=${product.category.slug}`}
                className="hover:text-[var(--gold)]"
              >
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-[var(--text-secondary)]">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative w-full aspect-[4/3] lg:sticky lg:top-28 lg:self-start">
            <ProductImage
              name={product.name}
              emoji={product.emoji}
              width={1200}
              height={900}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          <BuyBox product={product} />
        </div>

        <div className="mt-16 border-t border-[var(--border-subtle)] pt-12">
          <ProductReviews slug={product.slug} />
        </div>
      </div>
    </section>
  );
}

function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const showToast = useUiStore((s) => s.showToast);

  const [qty, setQty] = useState(1);

  const inCart = cartItems.some((i) => i.productId === product.id);
  const inWishlist = wishlistIds.includes(product.id);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= LOW_STOCK_THRESHOLD;

  function add() {
    addItem(product, qty);
    showToast(`Added ${qty} × ${product.name} to cart`, "success");
  }

  function buyNow() {
    addItem(product, qty);
    router.push("/checkout");
  }

  return (
    <div>
      <span className="text-xs text-[var(--gold)] uppercase tracking-wide font-semibold">
        {product.category.name}
      </span>
      <h1 className="display-title mt-2 mb-2" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)" }}>
        {product.name}
      </h1>

      {product.rating != null ? (
        <a href="#reviews-heading" className="inline-flex items-center gap-2 mb-3 hover:underline">
          <StarRating rating={product.rating} size={15} />
          <span className="text-sm text-[var(--gold)]">
            {product.rating.toFixed(1)} ({product.reviewsCount}{" "}
            {product.reviewsCount === 1 ? "review" : "reviews"})
          </span>
        </a>
      ) : (
        <div className="text-sm text-[var(--text-muted)] mb-3">No reviews yet</div>
      )}

      <div className="font-mono text-3xl font-semibold text-[var(--gold-light)] mb-4">
        {formatBase(product.priceCents)}
      </div>

      <p className="text-[var(--text-secondary)] leading-relaxed mb-6">{product.description}</p>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 border-y border-[var(--border-subtle)] py-5 mb-6 text-sm">
        <Spec icon={<MapPin size={16} />} label="Origin" value={product.origin} />
        <Spec
          icon={<Storefront size={16} />}
          label="Sold by"
          value={product.vendor.storeName}
        />
        <Spec
          icon={<Package size={16} />}
          label="Availability"
          value={
            soldOut
              ? "Out of stock"
              : lowStock
              ? `Only ${product.stock} left`
              : `${product.stock} in stock`
          }
          tone={soldOut ? "danger" : lowStock ? "warning" : undefined}
        />
        <Spec
          icon={<Truck size={16} />}
          label="Shipping"
          value={product.freeShipping ? "Free shipping" : "Calculated at checkout"}
          tone={product.freeShipping ? "success" : undefined}
        />
      </dl>

      <div className="mb-5 flex items-center gap-4">
        <label className="field-label mb-0" htmlFor="qty">
          Quantity
        </label>
        <div className="inline-flex items-center rounded-full border border-[var(--border-subtle)]">
          <button
            type="button"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-l-full text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)] disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || soldOut}
            aria-label="Decrease quantity"
          >
            <Minus size={14} weight="bold" />
          </button>
          <input
            id="qty"
            className="w-12 border-0 bg-transparent text-center font-mono text-sm text-white focus:outline-none"
            value={qty}
            inputMode="numeric"
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              if (Number.isFinite(next)) setQty(Math.min(Math.max(1, next), product.stock || 1));
            }}
            disabled={soldOut}
          />
          <button
            type="button"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-r-full text-[var(--text-secondary)] transition-colors hover:text-[var(--gold)] disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={qty >= product.stock || soldOut}
            aria-label="Increase quantity"
          >
            <Plus size={14} weight="bold" />
          </button>
        </div>
        {!soldOut && qty > 1 && (
          <span className="font-mono text-sm text-[var(--gold)]">
            {formatBase(product.priceCents * qty)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className={`btn flex-1 min-w-[10rem] flex items-center justify-center gap-2 ${
            inCart ? "btn-outline" : "btn-primary"
          }`}
          onClick={add}
          disabled={soldOut}
        >
          {inCart && <Check size={16} weight="bold" />}
          {soldOut ? "Out of stock" : inCart ? "Add another" : "Add to Cart"}
        </button>
        <button
          className="btn btn-success flex-1 min-w-[10rem]"
          onClick={buyNow}
          disabled={soldOut}
        >
          Buy Now
        </button>
        <button
          className={`btn btn-outline flex items-center justify-center gap-2 ${
            inWishlist ? "text-[var(--gold)] border-[var(--gold)]" : ""
          }`}
          onClick={() => {
            const nowIn = toggleWishlist(product.id);
            showToast(nowIn ? "Added to wishlist" : "Removed from wishlist", "success");
          }}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} weight={inWishlist ? "fill" : "regular"} />
        </button>
      </div>

      {inCart && (
        <button
          className="mt-3 inline-flex min-h-10 cursor-pointer items-center text-sm text-[var(--gold)] hover:underline"
          onClick={openCart}
        >
          View cart
        </button>
      )}

      <div className="mt-5">
        <ContactVendorButton
          vendorId={product.vendor.id}
          vendorName={product.vendor.storeName}
          productId={product.id}
        />
      </div>

      <Link
        href="/buyer-protection"
        className="mt-6 flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4 transition-colors hover:border-[var(--border-gold)]"
      >
        <ShieldCheck size={20} className="text-[var(--gold)] shrink-0 mt-0.5" />
        <span className="text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-white">Covered by buyer protection.</span> If it
          never arrives, arrives damaged, or is not as described, you can claim a refund.
        </span>
      </Link>
    </div>
  );
}

function Spec({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger";
}) {
  const toneClass = {
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    danger: "text-[var(--danger)]",
  };

  return (
    <div className="flex items-start gap-2.5">
      <span className="text-[var(--gold)] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</dt>
        <dd className={`mt-0.5 ${tone ? toneClass[tone] : "text-[var(--text-secondary)]"}`}>
          {value}
        </dd>
      </div>
    </div>
  );
}
