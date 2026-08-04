"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Product, Payout, FulfillmentStatus } from "@/types";

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
  netCents: number;
  fulfillmentStatus: FulfillmentStatus;
  /** Statuses this line may move to next, decided by the API. */
  nextStatuses: FulfillmentStatus[];
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
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

export interface VendorAnalytics {
  windowDays: number;
  revenueCents: number;
  netCents: number;
  unitsSold: number;
  orderCount: number;
  averageOrderCents: number;
  daily: { date: string; revenueCents: number; units: number }[];
  topProducts: {
    productId: number;
    name: string | null;
    slug: string | null;
    emoji: string | null;
    units: number;
    revenueCents: number;
  }[];
  fulfillment: Record<FulfillmentStatus, number>;
  lowStock: Product[];
  rating: { average: number | null; reviewCount: number };
}

export function useVendorAnalytics(days: number) {
  return useQuery<VendorAnalytics>({
    queryKey: [ "vendor", "analytics", days ],
    queryFn: () => apiFetch(`/vendor/analytics?days=${days}`),
    placeholderData: (previous) => previous,
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
  free_shipping: boolean;
}

export interface AdvanceOrderLineInput {
  id: number;
  fulfillment_status: FulfillmentStatus;
  carrier?: string;
  tracking_number?: string;
}

/** Moves one of this vendor's order lines along the fulfilment timeline. */
export function useAdvanceVendorOrderLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: AdvanceOrderLineInput) =>
      apiFetch<VendorOrderLine>(`/vendor/orders/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ "vendor" ] }),
  });
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
