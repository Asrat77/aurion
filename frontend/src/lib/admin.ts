"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Order, Product, RequestForQuote, RefundRequest, Review } from "@/types";

export interface AdminOverview {
  totalProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
  totalCustomers: number;
  totalRfqs: number;
  recentOrders: Order[];
}

export interface AdminCustomer {
  email: string;
  orders: number;
  totalCents: number;
}

export interface AdminVendor {
  id: number;
  storeName: string;
  slug: string;
  status: string;
  commissionRate: number;
  productCount: number;
  revenueCents: number;
}

export interface AdminAnalytics {
  totalRevenueCents: number;
  avgOrderCents: number;
  totalOrders: number;
  topProductName: string | null;
  topProductQty: number;
}

export function useAdminOverview() {
  return useQuery<AdminOverview>({
    queryKey: [ "admin", "overview" ],
    queryFn: () => apiFetch("/admin/overview"),
  });
}

export function useAdminOrders() {
  return useQuery<Order[]>({
    queryKey: [ "admin", "orders" ],
    queryFn: () => apiFetch("/admin/orders"),
  });
}

/** Admin intervention when a buyer and vendor cannot resolve an order. */
export function useAdminCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      apiFetch<Order>(`/admin/orders/${id}/cancel`, { method: "POST", body: { note } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ "admin" ] }),
  });
}

export function useAdminCustomers() {
  return useQuery<AdminCustomer[]>({
    queryKey: [ "admin", "customers" ],
    queryFn: () => apiFetch("/admin/customers"),
  });
}

export function useAdminVendors() {
  return useQuery<AdminVendor[]>({
    queryKey: [ "admin", "vendors" ],
    queryFn: () => apiFetch("/admin/vendors"),
  });
}

export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: [ "admin", "products" ],
    queryFn: () => apiFetch("/admin/products"),
  });
}

export function useAdminAnalytics() {
  return useQuery<AdminAnalytics>({
    queryKey: [ "admin", "analytics" ],
    queryFn: () => apiFetch("/admin/analytics"),
  });
}

export function useAdminRequestForQuotes() {
  return useQuery<RequestForQuote[]>({
    queryKey: [ "admin", "request-for-quotes" ],
    queryFn: () => apiFetch("/admin/request_for_quotes"),
  });
}

export function useAdminRefundRequests() {
  return useQuery<RefundRequest[]>({
    queryKey: [ "admin", "refund-requests" ],
    queryFn: () => apiFetch("/admin/refund_requests"),
  });
}

/** Upholds or declines a buyer protection claim. */
export function useResolveRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: number; decision: "approve" | "reject"; note?: string }) =>
      apiFetch<RefundRequest>(`/admin/refund_requests/${id}/${decision}`, {
        method: "POST",
        body: { note },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ "admin" ] }),
  });
}

export function useAdminReviews() {
  return useQuery<Review[]>({
    queryKey: [ "admin", "reviews" ],
    queryFn: () => apiFetch("/admin/reviews"),
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "published" | "hidden" }) =>
      apiFetch<Review>(`/admin/reviews/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ "admin" ] }),
  });
}
