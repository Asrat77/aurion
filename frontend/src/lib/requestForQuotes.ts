"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Incoterm, Product, RequestForQuote } from "@/types";

export const INCOTERMS: { value: Incoterm; label: string }[] = [
  { value: "EXW", label: "EXW — Ex Works" },
  { value: "FOB", label: "FOB — Free On Board" },
  { value: "CIF", label: "CIF — Cost, Insurance & Freight" },
  { value: "CFR", label: "CFR — Cost & Freight" },
  { value: "DAP", label: "DAP — Delivered At Place" },
];

export interface RequestForQuoteInput {
  company_name: string;
  contact_name: string;
  email: string;
  country: string;
  product_interest: string;
  estimated_quantity: string;
  specifications: string;
  product_id?: number;
  incoterm?: Incoterm | "";
  destination_port?: string;
  target_price_cents?: number | null;
  sample_requested?: boolean;
}

export function useCreateRequestForQuote() {
  return useMutation<RequestForQuote, Error, RequestForQuoteInput>({
    mutationFn: (requestForQuote) =>
      apiFetch("/request_for_quotes", {
        method: "POST",
        body: { request_for_quote: requestForQuote },
      }),
  });
}

/** Products a vendor has put commercial terms on. */
export function useWholesaleCatalogue() {
  return useQuery<Product[]>({
    queryKey: ["wholesale-catalogue"],
    queryFn: () => apiFetch("/request_for_quotes/catalogue"),
  });
}
