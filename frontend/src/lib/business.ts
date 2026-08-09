"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useProducts } from "@/lib/products";
import type { BusinessOrganization, BusinessQuotation, BusinessRFQ, BusinessTradeOrder, Incoterm, SupplierInvitation } from "@/types";

export interface BusinessOrganizationInput {
  name: string;
  legal_name?: string;
  kind: "buyer" | "supplier";
  registration_number?: string;
  country?: string;
}

export interface BusinessRFQInput {
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
  inspection_required?: boolean;
  currency?: string;
  items?: { product_id?: number; description: string; quantity: number; unit_of_measure?: string; specifications?: string }[];
}

export interface SupplierQuotationInput {
  currency: string;
  incoterm?: Incoterm | "";
  lead_time_days?: number | null;
  shipping_cents: number;
  valid_until?: string;
  note?: string;
  items: { product_id?: number; description: string; quantity: number; unit_price_cents: number }[];
}

const businessPath = (path: string) => `/business${path}`;

export function useBusinessOrganizations(enabled = true) {
  return useQuery<BusinessOrganization[]>({ queryKey: ["business-organizations"], queryFn: () => apiFetch(businessPath("/organizations")), enabled });
}

export function useBusinessCatalogue() {
  return useProducts({ channel: "business" });
}

export function useCreateBusinessOrganization() {
  const qc = useQueryClient();
  return useMutation<BusinessOrganization, Error, BusinessOrganizationInput>({
    mutationFn: (organization) => apiFetch(businessPath("/organizations"), { method: "POST", body: { organization } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-organizations"] }),
  });
}

export function useBusinessRFQs(enabled = true) {
  return useQuery<BusinessRFQ[]>({ queryKey: ["business-rfqs"], queryFn: () => apiFetch(businessPath("/request_for_quotes")), enabled });
}

export function useBusinessRFQ(id: number | null) {
  return useQuery<BusinessRFQ>({ queryKey: ["business-rfq", id], queryFn: () => apiFetch(businessPath(`/request_for_quotes/${id}`)), enabled: !!id });
}

export function useCreateBusinessRFQ() {
  const qc = useQueryClient();
  return useMutation<BusinessRFQ, Error, { organizationId: number; input: BusinessRFQInput }>({
    mutationFn: ({ organizationId, input }) => apiFetch(businessPath(`/organizations/${organizationId}/request_for_quotes`), { method: "POST", body: { request_for_quote: input } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-rfqs"] }),
  });
}

export function usePublishBusinessRFQ() {
  const qc = useQueryClient();
  return useMutation<BusinessRFQ, Error, number>({
    mutationFn: (id) => apiFetch(businessPath(`/request_for_quotes/${id}/publication`), { method: "POST", body: {} }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["business-rfqs"] });
      qc.invalidateQueries({ queryKey: ["business-rfq", id] });
    },
  });
}

export function useBusinessOpportunities(enabled = true) {
  return useQuery<SupplierInvitation[]>({ queryKey: ["business-opportunities"], queryFn: () => apiFetch(businessPath("/opportunities")), enabled });
}

export function useBusinessOpportunity(id: number | null) {
  return useQuery<SupplierInvitation & { requestForQuote?: BusinessRFQ }>({ queryKey: ["business-opportunity", id], queryFn: () => apiFetch(businessPath(`/opportunities/${id}`)), enabled: !!id });
}

export function useCreateBusinessQuotation() {
  const qc = useQueryClient();
  return useMutation<BusinessQuotation, Error, { opportunityId: number; input: SupplierQuotationInput }>({
    mutationFn: ({ opportunityId, input }) => apiFetch(businessPath(`/opportunities/${opportunityId}/quotations`), { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-opportunities"] }),
  });
}

export function useSubmitBusinessQuotation() {
  const qc = useQueryClient();
  return useMutation<BusinessQuotation, Error, number>({
    mutationFn: (id) => apiFetch(businessPath(`/quotations/${id}/submission`), { method: "POST", body: {} }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-opportunities"] });
      qc.invalidateQueries({ queryKey: ["business-quotations"] });
    },
  });
}

export function useBusinessQuotations(enabled = true) {
  return useQuery<BusinessQuotation[]>({ queryKey: ["business-quotations"], queryFn: () => apiFetch(businessPath("/quotations")), enabled });
}

export function useAcceptBusinessQuotation() {
  const qc = useQueryClient();
  return useMutation<BusinessTradeOrder, Error, { quotationId: number; organizationId: number }>({
    mutationFn: ({ quotationId, organizationId }) => apiFetch(businessPath(`/quotations/${quotationId}/acceptance`), { method: "POST", body: { organization_id: organizationId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-rfqs"] });
      qc.invalidateQueries({ queryKey: ["business-quotations"] });
      qc.invalidateQueries({ queryKey: ["business-trade-orders"] });
    },
  });
}

export function useBusinessTradeOrders(enabled = true) {
  return useQuery<BusinessTradeOrder[]>({ queryKey: ["business-trade-orders"], queryFn: () => apiFetch(businessPath("/trade_orders")), enabled });
}

export function useBusinessTradeOrder(id: number | null) {
  return useQuery<BusinessTradeOrder>({ queryKey: ["business-trade-order", id], queryFn: () => apiFetch(businessPath(`/trade_orders/${id}`)), enabled: !!id });
}

export function useAcceptTradeOrder() {
  const qc = useQueryClient();
  return useMutation<BusinessTradeOrder, Error, { id: number; organizationId: number; role: "buyer" | "supplier" }>({
    mutationFn: ({ id, organizationId, role }) => apiFetch(businessPath(`/trade_orders/${id}/acceptance`), { method: "POST", body: { organization_id: organizationId, role } }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["business-trade-order", variables.id] }),
  });
}

export function useRequestProtectedPayment() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: (id) => apiFetch(businessPath(`/trade_orders/${id}/protected_payment`), { method: "POST", body: {} }),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ["business-trade-order", id] }),
  });
}

export function useSandboxFundTrade() {
  const qc = useQueryClient();
  return useMutation<BusinessTradeOrder, Error, number>({
    mutationFn: (id) => apiFetch(businessPath(`/trade_orders/${id}/sandbox_funding`), { method: "POST", body: {} }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["business-trade-order", id] });
      qc.invalidateQueries({ queryKey: ["business-trade-orders"] });
    },
  });
}

export function useSubmitInspectionReport() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: number; body: string }>({
    mutationFn: ({ id, body }) => apiFetch(businessPath(`/trade_orders/${id}/inspection_report`), { method: "POST", body: { body } }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["business-trade-order", variables.id] }),
  });
}

export function useRecordShipment() {
  const qc = useQueryClient();
  return useMutation<BusinessTradeOrder, Error, { id: number; carrier: string; tracking_number: string }>({
    mutationFn: ({ id, carrier, tracking_number }) => apiFetch(businessPath(`/trade_orders/${id}/shipment`), { method: "POST", body: { carrier, tracking_number } }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["business-trade-order", variables.id] }),
  });
}

export function useAcceptDelivery() {
  const qc = useQueryClient();
  return useMutation<BusinessTradeOrder, Error, { id: number; organizationId: number }>({
    mutationFn: ({ id, organizationId }) => apiFetch(businessPath(`/trade_orders/${id}/delivery_acceptance`), { method: "POST", body: { organization_id: organizationId } }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["business-trade-order", variables.id] }),
  });
}

export function useOpenTradeDispute() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: number; reason: string; detail: string; amount_cents?: number }>({
    mutationFn: ({ id, ...body }) => apiFetch(businessPath(`/trade_orders/${id}/dispute`), { method: "POST", body }),
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["business-trade-order", variables.id] }),
  });
}

export function useCancelTradeOrder() {
  const qc = useQueryClient();
  return useMutation<BusinessTradeOrder, Error, { id: number; organizationId: number }>({
    mutationFn: ({ id, organizationId }) => apiFetch(businessPath(`/trade_orders/${id}/cancellation`), { method: "POST", body: { organization_id: organizationId } }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["business-trade-order", variables.id] });
      qc.invalidateQueries({ queryKey: ["business-trade-orders"] });
    },
  });
}
