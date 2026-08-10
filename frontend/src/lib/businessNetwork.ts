"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface NetworkSnapshot {
  suppliers: { total: number; verified: number; countries: number; regions: { region: string; suppliers: number }[] };
  catalogue: {
    products: number;
    categories: { id: number; name: string; slug: string; emoji: string | null; products: number; suppliers: number }[];
  };
  sourcing: {
    openRequests: number;
    invitationsSent: number;
    quotationsSubmitted: number;
    requestsMatched: number;
    /** Null until at least one supplier has actually answered an invitation. */
    medianResponseHours: number | null;
  };
  trades: { active: number; completed: number; protectedCents: number; currency: string };
  protection: { mode: "live" | "sandbox" | "disabled"; live: boolean; label: string };
  measuredAt: string;
}

export interface DirectorySupplier {
  id: number;
  slug: string;
  name: string;
  organizationName: string | null;
  verified: boolean;
  country: string | null;
  city: string | null;
  regions: string[];
  certifications: string[];
  categories: string[];
  businessProducts: number;
  minQuantity: number | null;
  maxLeadTimeDays: number | null;
  destinations: string[];
  invitations: number;
  quotationsSubmitted: number;
  tradesCompleted: number;
}

export interface DirectoryFacet {
  value: string;
  label?: string;
  count: number;
}

export interface SupplierDirectory {
  suppliers: DirectorySupplier[];
  facets: { regions: DirectoryFacet[]; certifications: DirectoryFacet[]; categories: DirectoryFacet[] };
}

export interface MatchCriterion {
  key: string;
  label: string;
  max: number;
}

export interface MatchCandidate {
  vendorId: number;
  vendorName: string;
  organizationName: string | null;
  verified: boolean;
  score: number;
  reasons: string[];
  breakdown: { key: string; label: string; points: number; max: number; note: string | null }[];
  invited: boolean;
  invitationStatus: string | null;
  invitedAt: string | null;
  respondedAt: string | null;
  quotationId: number | null;
  quotationStatus: string | null;
  quotationTotalCents: number | null;
}

export interface MatchReport {
  requestForQuoteId: number;
  reference: string;
  status: string;
  maxScore: number;
  inviteLimit: number;
  criteria: MatchCriterion[];
  candidates: MatchCandidate[];
  shortlisted: number[];
  excluded: { vendorId: number; vendorName: string; reason: string }[];
  funnel: { invited: number; viewed: number; quoted: number; declined: number; awarded: number };
  events: { event: string; occurredAt: string; details: Record<string, unknown> }[];
}

export interface SourcingMonitor {
  network: NetworkSnapshot;
  funnel: { invited: number; viewed: number; quoted: number; declined: number; awarded: number; awaitingResponse: number };
  exceptions: {
    requestForQuoteId: number;
    reference: string;
    status: string;
    organizationName: string | null;
    productInterest: string | null;
    matchCount: number;
    severity: "manual_sourcing" | "thin_shortlist";
    createdAt: string;
  }[];
  recentMatchRuns: {
    id: number;
    event: string;
    requestForQuoteId: number | null;
    reference: string | null;
    details: Record<string, unknown>;
    occurredAt: string;
  }[];
  pipeline: Record<string, number>;
  slowestResponses: { id: number; reference: string; vendorName: string; status: string; waitingHours: number }[];
  assistant: {
    config: { enabled: boolean; provider: string | null; model: string | null; reason: string | null };
    last7Days: number;
    answered: number;
    failed: number;
    byTask: Record<string, number>;
    byChannel: Record<string, number>;
    medianLatencyMs: number | null;
    recent: {
      id: number;
      task: string;
      channel: string;
      status: string;
      question: string;
      groundedOn: Record<string, number>;
      latencyMs: number | null;
      createdAt: string;
    }[];
  };
}

export function useNetworkSnapshot() {
  return useQuery<NetworkSnapshot>({
    queryKey: ["business-network"],
    queryFn: () => apiFetch("/business/network"),
    staleTime: 60_000,
  });
}

export interface SupplierFilters {
  region?: string;
  category?: string;
  certification?: string;
  verified?: boolean;
  q?: string;
}

export function useSupplierDirectory(filters: SupplierFilters = {}) {
  const search = new URLSearchParams();
  if (filters.region) search.set("region", filters.region);
  if (filters.category) search.set("category", filters.category);
  if (filters.certification) search.set("certification", filters.certification);
  if (filters.verified) search.set("verified", "true");
  if (filters.q) search.set("q", filters.q);
  const query = search.toString();

  return useQuery<SupplierDirectory>({
    queryKey: ["business-suppliers", query],
    queryFn: () => apiFetch(`/business/suppliers${query ? `?${query}` : ""}`),
  });
}

/** The match console. Only the RFQ's own organization can read it. */
export function useMatchReport(rfqId: number | null) {
  return useQuery<MatchReport>({
    queryKey: ["business-matching", rfqId],
    queryFn: () => apiFetch(`/business/request_for_quotes/${rfqId}/matching`),
    enabled: !!rfqId,
  });
}

export function useSourcingMonitor(enabled = true) {
  return useQuery<SourcingMonitor>({
    queryKey: ["admin-sourcing"],
    queryFn: () => apiFetch("/admin/business/sourcing"),
    enabled,
    refetchInterval: 60_000,
  });
}
