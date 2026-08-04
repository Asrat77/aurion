"use client";

import { Star, X } from "@phosphor-icons/react";
import { useProductFacets, type ProductsQuery } from "@/lib/products";
import { formatBase } from "@/lib/money";

export interface FilterState {
  origin: string[];
  minPriceCents: number | null;
  maxPriceCents: number | null;
  minRating: number | null;
  inStock: boolean;
  freeShipping: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  origin: [],
  minPriceCents: null,
  maxPriceCents: null,
  minRating: null,
  inStock: false,
  freeShipping: false,
};

export function activeFilterCount(filters: FilterState) {
  return (
    filters.origin.length +
    (filters.minPriceCents != null || filters.maxPriceCents != null ? 1 : 0) +
    (filters.minRating != null ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.freeShipping ? 1 : 0)
  );
}

export function filtersToQuery(filters: FilterState): Partial<ProductsQuery> {
  return {
    origin: filters.origin.length ? filters.origin : undefined,
    minPriceCents: filters.minPriceCents,
    maxPriceCents: filters.maxPriceCents,
    minRating: filters.minRating,
    inStock: filters.inStock,
    freeShipping: filters.freeShipping,
  };
}

const RATINGS = [4, 3, 2];

export default function ProductFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const { data: facets } = useProductFacets();

  function patch(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function toggleOrigin(origin: string) {
    patch({
      origin: filters.origin.includes(origin)
        ? filters.origin.filter((o) => o !== origin)
        : [...filters.origin, origin],
    });
  }

  // Prices are entered in whole currency units but stored and filtered in cents.
  function priceInput(value: number | null) {
    return value == null ? "" : String(value / 100);
  }

  function parsePrice(raw: string) {
    if (raw.trim() === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
  }

  const count = activeFilterCount(filters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="section-label">Refine</h3>
        {count > 0 && (
          <button
            className="inline-flex min-h-9 cursor-pointer items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--gold)]"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X size={12} /> Clear {count}
          </button>
        )}
      </div>

      <fieldset>
        <legend className="field-label">Price</legend>
        <div className="flex items-center gap-2">
          <input
            className="input"
            type="number"
            min="0"
            inputMode="decimal"
            aria-label="Minimum price"
            placeholder={facets ? String(Math.floor(facets.priceRange.minCents / 100)) : "Min"}
            value={priceInput(filters.minPriceCents)}
            onChange={(e) => patch({ minPriceCents: parsePrice(e.target.value) })}
          />
          <span className="text-[var(--text-muted)]">&ndash;</span>
          <input
            className="input"
            type="number"
            min="0"
            inputMode="decimal"
            aria-label="Maximum price"
            placeholder={facets ? String(Math.ceil(facets.priceRange.maxCents / 100)) : "Max"}
            value={priceInput(filters.maxPriceCents)}
            onChange={(e) => patch({ maxPriceCents: parsePrice(e.target.value) })}
          />
        </div>
        {facets && (
          <p className="field-help">
            Catalogue runs {formatBase(facets.priceRange.minCents)} to{" "}
            {formatBase(facets.priceRange.maxCents)}.
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="field-label">Rating</legend>
        <div className="flex flex-col gap-1">
          {RATINGS.map((rating) => (
            <label
              key={rating}
              className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-[var(--text-secondary)]"
            >
              <input
                type="radio"
                name="min-rating"
                className="h-4 w-4 accent-[var(--gold)]"
                checked={filters.minRating === rating}
                onChange={() => patch({ minRating: rating })}
              />
              <span className="inline-flex items-center gap-1">
                <Star size={13} weight="fill" className="text-[var(--gold)]" />
                {`${rating} & up`}
              </span>
            </label>
          ))}
          <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-[var(--text-secondary)]">
            <input
              type="radio"
              name="min-rating"
              className="h-4 w-4 accent-[var(--gold)]"
              checked={filters.minRating == null}
              onChange={() => patch({ minRating: null })}
            />
            Any rating
          </label>
        </div>
      </fieldset>

      {facets && facets.origins.length > 0 && (
        <fieldset>
          <legend className="field-label">Origin</legend>
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
            {facets.origins.map((origin) => (
              <label
                key={origin}
                className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-[var(--text-secondary)]"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--gold)]"
                  checked={filters.origin.includes(origin)}
                  onChange={() => toggleOrigin(origin)}
                />
                {origin}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="field-label">Availability</legend>
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--gold)]"
            checked={filters.inStock}
            onChange={(e) => patch({ inStock: e.target.checked })}
          />
          In stock only
          {facets && <span className="text-[var(--text-muted)]">({facets.inStockCount})</span>}
        </label>
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--gold)]"
            checked={filters.freeShipping}
            onChange={(e) => patch({ freeShipping: e.target.checked })}
          />
          Free shipping
          {facets && (
            <span className="text-[var(--text-muted)]">({facets.freeShippingCount})</span>
          )}
        </label>
      </fieldset>
    </div>
  );
}
