"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface StorefrontSettings {
  baseCurrency: string;
  etbPerUsd: number;
  freeShippingThresholdCents: number;
  ethiopiaVatRate: number;
}

export function useSettings() {
  return useQuery<StorefrontSettings>({
    queryKey: ["settings"],
    queryFn: () => apiFetch("/settings"),
    // The birr rate moves slowly; refetching it on every mount is noise.
    staleTime: 60 * 60 * 1000,
  });
}
