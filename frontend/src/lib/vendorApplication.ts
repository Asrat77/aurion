"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { VendorApplication } from "@/types";

/**
 * The signed-in user's own application, or null if they have not applied.
 * The API answers 204 in that case, which apiFetch surfaces as null.
 */
export function useMyVendorApplication(enabled = true) {
  return useQuery<VendorApplication | null>({
    queryKey: ["vendor-application"],
    queryFn: () => apiFetch("/vendor_application"),
    enabled,
  });
}

export interface VendorApplicationInput {
  store_name: string;
  contact_name: string;
  contact_phone: string;
  country: string;
  city: string;
  product_focus: string;
  business_registration: string;
  website: string;
  bio: string;
}

export function useSubmitVendorApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VendorApplicationInput) =>
      apiFetch<VendorApplication>("/vendor_application", { method: "POST", body: payload }),
    onSuccess: (application) => {
      qc.setQueryData(["vendor-application"], application);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
