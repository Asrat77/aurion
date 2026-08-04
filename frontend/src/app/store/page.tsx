"use client";

import { Suspense, useDeferredValue, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  Funnel,
  MagnifyingGlass,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { useCategories, useProducts } from "@/lib/products";
import ProductCard from "@/components/products/ProductCard";
import ProductFilters, {
  EMPTY_FILTERS,
  activeFilterCount,
  filtersToQuery,
  type FilterState,
} from "@/components/products/ProductFilters";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

const SORT_KEYS = [
  { value: "popular", key: "store.sort.popular" },
  { value: "price_asc", key: "store.sort.priceAsc" },
  { value: "price_desc", key: "store.sort.priceDesc" },
  { value: "newest", key: "store.sort.newest" },
  { value: "name", key: "store.sort.name" },
];

function StoreContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const { data: categories } = useCategories();
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useProducts({ category, q: deferredSearch, sort, ...filtersToQuery(filters) });

  const filterCount = activeFilterCount(filters);

  function clearFilters() {
    setCategory("all");
    setSearch("");
    setSort("popular");
    setFilters(EMPTY_FILTERS);
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)] px-4 pb-16 pt-36 sm:px-6 lg:px-8 lg:pb-20 lg:pt-44">
        <div className="absolute inset-0 aurion-pattern opacity-[0.13]" />
        <div className="absolute -right-40 -top-28 h-[560px] w-[560px] rounded-full bg-[var(--blue-glow)] blur-[150px]" />
        <div className="relative mx-auto max-w-[var(--container-wide)]">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div>
              <p className="section-label">{t("store.eyebrow")}</p>
              <h1 className="display-title max-w-[860px]">{t("store.title")}</h1>
            </div>
            <div className="lg:justify-self-end">
              <p className="max-w-[550px] text-base leading-[1.9] text-[var(--text-secondary)]">
{t("store.intro")}
              </p>
              <Link
                href="/source"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold)] transition-colors hover:text-white"
              >
                {t("store.commercialCta")} <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[var(--container-wide)]">
          <div className="mb-10 rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(9,13,22,0.82)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
            <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CategoryButton
                active={category === "all"}
                label={t("store.allProducts")}
                onClick={() => setCategory("all")}
              />
              {categories?.map((item) => (
                <CategoryButton
                  key={item.slug}
                  active={category === item.slug}
                  label={item.name}
                  onClick={() => setCategory(item.slug)}
                />
              ))}
            </div>

            <div className="mt-3 grid gap-3 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-[1fr_auto]">
              <label className="relative block">
                <span className="sr-only">{t("store.searchLabel")}</span>
                <MagnifyingGlass
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="search"
                  placeholder={t("store.searchPlaceholder")}
                  className="input pl-11"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="flex gap-3">
                <label className="relative block min-w-[200px] flex-1">
                  <span className="sr-only">{t("store.sortLabel")}</span>
                  <SlidersHorizontal
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--gold)]"
                  />
                  <select
                    className="input cursor-pointer pl-11"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    {SORT_KEYS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.key)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-[var(--border-gold)] px-5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)] transition-colors hover:bg-[rgba(214,180,94,0.08)] lg:hidden"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                >
                  <Funnel size={15} />
                  {t("store.filters")}
                  {filterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1.5 font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--bg-deep)]">
                      {filterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-5 lg:hidden">
                <ProductFilters filters={filters} onChange={setFilters} />
              </div>
            )}
          </div>

          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[0.58rem] uppercase tracking-[0.2em] text-[var(--gold)]">
                {t("store.curated")}
              </span>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
                {category === "all"
                  ? t("store.allProducts")
                  : categories?.find((item) => item.slug === category)?.name ?? "Products"}
              </h2>
            </div>
            {!isLoading && !isError ? (
              <span className="font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {t("store.itemCount", { count: data?.meta.total ?? 0 })}
              </span>
            ) : null}
          </div>

          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="hidden h-fit rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(9,13,22,0.82)] p-5 lg:sticky lg:top-28 lg:block">
              <ProductFilters filters={filters} onChange={setFilters} />
            </aside>

            <div className="min-w-0">
              {isLoading ? (
                <ProductGridSkeleton />
              ) : isError ? (
                <EmptyState
                  icon={<MagnifyingGlass size={32} />}
                  title={t("store.loadFailed")}
                  body={t("store.loadFailedBody")}
                  action={
                    <button type="button" className="btn btn-outline" onClick={() => refetch()}>
                      {t("store.tryAgain")}
                    </button>
                  }
                />
              ) : !data || data.products.length === 0 ? (
                <EmptyState
                  icon={<MagnifyingGlass size={32} />}
                  title={t("store.noMatch")}
                  body={t("store.noMatchBody")}
                  action={
                    <button type="button" className="btn btn-outline" onClick={clearFilters}>
                      {t("store.clearFilters")}
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-20 overflow-hidden rounded-[28px] border border-[var(--border-gold)] bg-[linear-gradient(120deg,#0b1729,#080b12)] p-7 sm:p-10 lg:p-12">
            <div className="absolute inset-0 aurion-pattern opacity-[0.15]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-[800px] gap-5">
                <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--border-gold)] text-[var(--gold)] sm:flex">
                  <Buildings size={25} />
                </span>
                <div>
                  <span className="font-[family-name:var(--font-mono)] text-[0.58rem] uppercase tracking-[0.2em] text-[var(--gold)]">Need more than a cart?</span>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight text-white sm:text-4xl">Move from browsing to a structured sourcing request.</h2>
                </div>
              </div>
              <Link href="/source" className="btn btn-primary inline-flex shrink-0 items-center justify-center gap-2 self-start lg:self-auto">
                Source at scale <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CategoryButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-[18px] text-sm font-medium tracking-wide transition-[color,background-color,border-color] duration-200 ease-[var(--ease-out)] ${
        active
          ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--bg-deep)]"
          : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
      }`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense
      fallback={
        <section className="px-4 pb-20 pt-36 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[var(--container-wide)]">
            <ProductGridSkeleton />
          </div>
        </section>
      }
    >
      <StoreContent />
    </Suspense>
  );
}
