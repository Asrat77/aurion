"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PendingReview, Review, ReviewSummary } from "@/types";

export interface ProductReviews {
  summary: ReviewSummary;
  reviews: Review[];
}

export function useProductReviews(slug: string) {
  return useQuery<ProductReviews>({
    queryKey: ["reviews", slug],
    queryFn: () => apiFetch(`/products/${slug}/reviews`),
    enabled: !!slug,
  });
}

/** Delivered purchases the signed-in buyer has not written about yet. */
export function usePendingReviews(enabled = true) {
  return useQuery<PendingReview[]>({
    queryKey: ["reviews", "pending"],
    queryFn: () => apiFetch("/reviews/pending"),
    enabled,
  });
}

export interface CreateReviewInput {
  order_item_id: number;
  rating: number;
  title?: string;
  body?: string;
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewInput) =>
      apiFetch<Review>("/reviews", { method: "POST", body: payload }),
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      // The product's average moved, so listings and its detail page are stale.
      qc.invalidateQueries({ queryKey: ["product", review.productSlug] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
