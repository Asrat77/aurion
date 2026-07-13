"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Product, Payout } from "@/types";

export interface VendorOverview {
  productCount: number;
  itemsSold: number;
  grossCents: number;
  netCents: number;
  commissionRate: number;
  products: Product[];
}

export interface VendorOrderLine {
  id: number;
  orderReference: string;
  productName: string;
  emoji: string | null;
  quantity: number;
  lineTotalCents: number;
  buyerEmail: string;
  createdAt: string;
}

export interface VendorPayouts {
  grossCents: number;
  commissionCents: number;
  netCents: number;
  payouts: Payout[];
}

export function useVendorOverview() {
  return useQuery<VendorOverview>({
    queryKey: [ "vendor", "overview" ],
    queryFn: () => apiFetch("/vendor/overview"),
  });
}

export function useVendorOrders() {
  return useQuery<VendorOrderLine[]>({
    queryKey: [ "vendor", "orders" ],
    queryFn: () => apiFetch("/vendor/orders"),
  });
}

export function useVendorPayouts() {
  return useQuery<VendorPayouts>({
    queryKey: [ "vendor", "payouts" ],
    queryFn: () => apiFetch("/vendor/payouts"),
  });
}

export interface VendorProductInput {
  name: string;
  category_id: number;
  description: string;
  price_cents: number;
  stock: number;
  emoji: string;
  origin: string;
}

export function useCreateVendorProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VendorProductInput) =>
      apiFetch<Product>("/vendor/products", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ "vendor" ] }),
  });
}

export function useUpdateVendorProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<VendorProductInput> & { id: number }) =>
      apiFetch<Product>(`/vendor/products/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ "vendor" ] }),
  });
}

export function useDeleteVendorProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/vendor/products/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ "vendor" ] }),
  });
}
