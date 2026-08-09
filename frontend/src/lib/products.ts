"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Category, Product, ProductFacets } from "@/types";

export interface ProductsQuery {
  channel?: "express" | "business";
  category?: string;
  q?: string;
  sort?: string;
  origin?: string[];
  minPriceCents?: number | null;
  maxPriceCents?: number | null;
  minRating?: number | null;
  inStock?: boolean;
  freeShipping?: boolean;
  vendor?: string;
}

export interface ProductsPage {
  products: Product[];
  meta: { total: number; page: number; per: number; pages: number };
}

function toSearchParams(query: ProductsQuery) {
  const params = new URLSearchParams();

  if (query.channel) params.set("channel", query.channel);
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.sort && query.sort !== "popular") params.set("sort", query.sort);
  // Rails reads repeated `origin[]` keys as an array.
  query.origin?.forEach((o) => params.append("origin[]", o));
  if (query.minPriceCents != null) params.set("min_price", String(query.minPriceCents));
  if (query.maxPriceCents != null) params.set("max_price", String(query.maxPriceCents));
  if (query.minRating != null) params.set("min_rating", String(query.minRating));
  if (query.inStock) params.set("in_stock", "true");
  if (query.freeShipping) params.set("free_shipping", "true");
  if (query.vendor) params.set("vendor", query.vendor);
  params.set("per", "100");

  return params;
}

export function useProducts(query: ProductsQuery) {
  const params = toSearchParams(query);

  return useQuery<ProductsPage>({
    queryKey: ["products", query],
    queryFn: () => apiFetch(`/products?${params.toString()}`),
    placeholderData: (previous) => previous,
  });
}

/** Filter options derived from the live catalogue, not hardcoded. */
export function useProductFacets() {
  return useQuery<ProductFacets>({
    queryKey: ["product-facets"],
    queryFn: () => apiFetch("/products/facets"),
  });
}

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => apiFetch(`/products/${slug}`),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });
}
