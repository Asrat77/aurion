"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useProducts, useCategories } from "@/lib/products";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name A-Z" },
];

function StoreContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("popular");

  const { data: categories } = useCategories();
  const { data, isLoading } = useProducts({ category, q, sort });

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-wide)] mx-auto">
        <PageHeader
          title="Global Ethiopian Marketplace"
          description="Authentic Ethiopian products, from farm to front door. Coffee, teff, spices, honey, textiles, and more, sourced directly from producers and shipped worldwide."
        />

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            className={`px-[18px] py-2 rounded-full border text-sm font-medium tracking-wide transition-[color,background-color,border-color] duration-200 ease-[var(--ease-out)] ${
              category === "all"
                ? "bg-[var(--gold)] text-[var(--bg-deep)] border-[var(--gold)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
            }`}
            onClick={() => setCategory("all")}
          >
            All
          </button>
          {categories?.map((c) => (
            <button
              key={c.slug}
              className={`px-[18px] py-2 rounded-full border text-sm font-medium tracking-wide transition-[color,background-color,border-color] duration-200 ease-[var(--ease-out)] ${
                category === c.slug
                  ? "bg-[var(--gold)] text-[var(--bg-deep)] border-[var(--gold)]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              }`}
              onClick={() => setCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search products..."
              className="input pl-10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.products.length === 0 ? (
          <EmptyState
            icon={<MagnifyingGlass size={32} />}
            title="No products match"
            body="Try a different category or search term."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-[var(--container-wide)] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>
      }
    >
      <StoreContent />
    </Suspense>
  );
}
