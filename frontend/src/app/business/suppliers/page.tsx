"use client";

import { useState } from "react";
import { MagnifyingGlass, SealCheck } from "@phosphor-icons/react";
import { useSupplierDirectory, type DirectoryFacet, type SupplierFilters } from "@/lib/businessNetwork";
import SupplierCard from "@/components/business/SupplierCard";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * The verified supplier directory. Filters are driven by facets counted from
 * administrator-verified capabilities, so the UI never offers a filter that
 * would return nothing.
 */
export default function SuppliersPage() {
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [search, setSearch] = useState("");
  const directory = useSupplierDirectory(filters);
  const facets = directory.data?.facets;

  function toggle(key: keyof SupplierFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--b-line)] pb-7">
        <div>
          <p className="b-eyebrow">Supplier directory</p>
          <h1 className="display-title mt-2">Verified Ethiopian suppliers</h1>
          <p className="mt-2.5 max-w-[560px] text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
            Every badge below is stored data. Verification comes from the organization record and certifications from
            capabilities an administrator has checked.
          </p>
        </div>
        <form
          className="flex w-full max-w-[320px] items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({ ...current, q: search.trim() || undefined }));
          }}
        >
          <label className="sr-only" htmlFor="supplier-search">
            Search suppliers
          </label>
          <input
            id="supplier-search"
            className="input"
            placeholder="Search by supplier name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="btn btn-primary shrink-0" aria-label="Search">
            <MagnifyingGlass size={16} />
          </button>
        </form>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <label className="flex cursor-pointer items-center gap-2.5 text-[0.85rem] font-semibold text-[var(--text-primary)]">
            <input
              type="checkbox"
              className="accent-[var(--b-navy)]"
              checked={!!filters.verified}
              onChange={(event) => setFilters((current) => ({ ...current, verified: event.target.checked || undefined }))}
            />
            <SealCheck size={15} className="text-[var(--b-verified)]" weight="fill" />
            Verified only
          </label>

          <FacetGroup
            title="Region"
            options={facets?.regions}
            active={filters.region}
            onSelect={(value) => toggle("region", value)}
          />
          <FacetGroup
            title="Certification"
            options={facets?.certifications}
            active={filters.certification}
            onSelect={(value) => toggle("certification", value)}
          />
          <FacetGroup
            title="Category"
            options={facets?.categories}
            active={filters.category}
            onSelect={(value) => toggle("category", value)}
          />

          {activeCount > 0 ? (
            <button
              className="b-link text-[0.8rem]"
              onClick={() => {
                setFilters({});
                setSearch("");
              }}
            >
              Clear all filters
            </button>
          ) : null}
        </aside>

        <div>
          <p className="mb-4 text-[0.8rem] text-[var(--text-muted)]">
            {directory.isLoading
              ? "Loading suppliers"
              : `${directory.data?.suppliers.length ?? 0} ${
                  directory.data?.suppliers.length === 1 ? "supplier" : "suppliers"
                } match`}
          </p>

          {directory.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[240px] w-full" />
              ))}
            </div>
          ) : directory.data?.suppliers.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {directory.data.suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          ) : (
            <div className="b-panel p-10 text-center text-[0.88rem] text-[var(--text-secondary)]">
              No supplier matches these filters.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FacetGroup({
  title,
  options,
  active,
  onSelect,
}: {
  title: string;
  options?: DirectoryFacet[];
  active?: string;
  onSelect: (value: string) => void;
}) {
  if (!options?.length) return null;

  return (
    <div>
      <p className="b-eyebrow">{title}</p>
      <ul className="mt-2.5 space-y-1">
        {options.map((option) => (
          <li key={option.value}>
            <button
              onClick={() => onSelect(option.value)}
              aria-pressed={active === option.value}
              className={`flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-left text-[0.83rem] transition-colors ${
                active === option.value
                  ? "bg-[var(--b-tint)] font-semibold text-[var(--b-navy)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--b-tint)]"
              }`}
            >
              <span className="truncate">{option.label ?? option.value}</span>
              <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--text-muted)]">
                {option.count}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
