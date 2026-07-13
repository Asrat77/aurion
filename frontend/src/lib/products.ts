"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Category, Product } from "@/types";

export interface ProductsQuery {
  category?: string;
  q?: string;
  sort?: string;
}

export function useProducts(query: ProductsQuery) {
  const params = new URLSearchParams();
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  params.set("per", "100");

  return useQuery<{ products: Product[]; meta: { total: number; page: number; per: number } }>({
    queryKey: ["products", query],
    queryFn: () => apiFetch(`/products?${params.toString()}`),
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
