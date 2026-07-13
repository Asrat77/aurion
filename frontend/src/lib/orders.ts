"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/types";

export interface ShippingAddress {
  first: string;
  last: string;
  email: string;
  address: string;
  city: string;
  country: string;
  zip: string;
  phone: string;
}

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[];
  country: string;
  shipping_address: ShippingAddress;
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => apiFetch("/orders"),
  });
}

export function useOrder(id: number | null) {
  return useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => apiFetch(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      apiFetch<Order>("/orders", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useMockConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) =>
      apiFetch<Order>(`/payments/${orderId}/mock_confirm`, { method: "POST" }),
    onSuccess: (order) => {
      qc.setQueryData(["order", order.id], order);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
