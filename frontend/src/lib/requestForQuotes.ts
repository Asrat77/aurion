"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { RequestForQuote } from "@/types";

export interface RequestForQuoteInput {
  company_name: string;
  contact_name: string;
  email: string;
  country: string;
  product_interest: string;
  estimated_quantity: string;
  specifications: string;
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
