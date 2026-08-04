"use client";

import { Heart } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/lib/products";
import { useWishlistStore } from "@/store/wishlist";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export default function WishlistPage() {
  const { t } = useTranslation();
  const wishlistIds = useWishlistStore((s) => s.ids);
  const { data, isLoading } = useProducts({});

  const items = (data?.products ?? []).filter((p) => wishlistIds.includes(p.id));

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-wide)] mx-auto">
        <PageHeader title={t("wishlist.title")} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Heart size={32} />}
            title={t("wishlist.empty")}
            body={t("wishlist.emptyBody")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
