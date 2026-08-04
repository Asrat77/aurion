"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { RefundReason, RefundRequest } from "@/types";

export const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: "not_received", label: "It never arrived" },
  { value: "damaged", label: "It arrived damaged" },
  { value: "not_as_described", label: "Not as described" },
  { value: "wrong_item", label: "Wrong item sent" },
  { value: "other", label: "Something else" },
];

export function useMyRefundRequests(enabled = true) {
  return useQuery<RefundRequest[]>({
    queryKey: ["refund-requests"],
    queryFn: () => apiFetch("/refund_requests"),
    enabled,
  });
}

export interface CreateRefundInput {
  order_item_id: number;
  reason: RefundReason;
  detail?: string;
}

export function useCreateRefundRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRefundInput) =>
      apiFetch<RefundRequest>("/refund_requests", { method: "POST", body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["refund-requests"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
