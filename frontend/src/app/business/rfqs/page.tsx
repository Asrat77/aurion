"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Buildings, CheckCircle, Clock, FileText, Plus, ShieldCheck, Spinner, WarningCircle } from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  useAcceptBusinessQuotation,
  useBusinessOrganizations,
  useBusinessCatalogue,
  useBusinessRFQs,
  useBusinessTradeOrders,
  useCreateBusinessOrganization,
  useCreateBusinessRFQ,
  usePublishBusinessRFQ,
} from "@/lib/business";
import { formatMoney } from "@/lib/money";
import { useUiStore } from "@/store/ui";
import type { BusinessRFQ } from "@/types";

const EMPTY_RFQ = {
  company_name: "",
  contact_name: "",
  email: "",
  country: "Ethiopia",
  product_interest: "",
  estimated_quantity: "",
  specifications: "",
  product_id: undefined as number | undefined,
  incoterm: "FOB" as const,
  destination_port: "",
  target_price_cents: null as number | null,
  sample_requested: false,
  inspection_required: false,
  currency: "USD",
};

export default function BusinessWorkspace() {
  const { data: user, isLoading: userLoading } = useMe();
  const openAuth = useUiStore((state) => state.openAuth);
  const showToast = useUiStore((state) => state.showToast);
  const organizations = useBusinessOrganizations(!!user);
  const catalogue = useBusinessCatalogue();
  const rfqs = useBusinessRFQs(!!user);
  const trades = useBusinessTradeOrders(!!user);
  const createOrganization = useCreateBusinessOrganization();
  const createRfq = useCreateBusinessRFQ();
  const publishRfq = usePublishBusinessRFQ();
  const acceptQuotation = useAcceptBusinessQuotation();
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
  const [rfqForm, setRfqForm] = useState(EMPTY_RFQ);
  const [organizationForm, setOrganizationForm] = useState({ name: "", legal_name: "", country: "Ethiopia", registration_number: "" });
  const [error, setError] = useState("");

  const buyerOrganizations = useMemo(
    () => (organizations.data ?? []).filter((organization) => organization.kind === "buyer"),
    [organizations.data],
  );
  const selectedOrganization = buyerOrganizations.find((organization) => organization.id === organizationId) ?? buyerOrganizations[0];
  const selectedRfq = (rfqs.data ?? []).find((rfq) => rfq.id === selectedRfqId) ?? rfqs.data?.[0];

  function fail(caught: unknown) {
    setError(caught instanceof ApiError ? caught.message : "Something went wrong. Try again.");
  }

  async function handleCreateOrganization(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const organization = await createOrganization.mutateAsync({ ...organizationForm, kind: "buyer" });
      setOrganizationId(organization.id);
      setOrganizationForm({ name: "", legal_name: "", country: "Ethiopia", registration_number: "" });
      showToast("Organization created. Verification is required before publication.", "success");
    } catch (caught) {
      fail(caught);
    }
  }

  async function handleCreateRfq(event: FormEvent) {
    event.preventDefault();
    if (!selectedOrganization) return setError("Create or select a buyer organization first.");
    setError("");
    try {
      const rfq = await createRfq.mutateAsync({ organizationId: selectedOrganization.id, input: rfqForm });
      setSelectedRfqId(rfq.id);
      setRfqForm({ ...EMPTY_RFQ, company_name: selectedOrganization.name, contact_name: user?.name ?? "", email: user?.email ?? "" });
      showToast("RFQ saved. Publish it when the requirement is ready.", "success");
    } catch (caught) {
      fail(caught);
    }
  }

  async function handlePublish(rfq: BusinessRFQ) {
    try {
      await publishRfq.mutateAsync(rfq.id);
      showToast("RFQ published and matching suppliers invited.", "success");
    } catch (caught) {
      fail(caught);
    }
  }

  async function handleAccept(quotationId: number) {
    if (!selectedOrganization) return;
    try {
      await acceptQuotation.mutateAsync({ quotationId, organizationId: selectedOrganization.id });
      showToast("Quotation accepted. The protected trade contract is ready for both parties.", "success");
    } catch (caught) {
      fail(caught);
    }
  }

  if (userLoading) return <LoadingState />;
  if (!user) {
    return (
      <section className="px-4 pb-24 pt-36 sm:px-6 lg:px-8 lg:pt-44">
        <div className="mx-auto max-w-[var(--container-narrow)] rounded-[28px] border border-[var(--border-gold)] bg-[var(--bg-card)] p-8 text-center sm:p-12">
          <ShieldCheck size={42} className="mx-auto text-[var(--gold)]" />
          <h1 className="display-title mt-5">Your sourcing desk</h1>
          <p className="mx-auto mt-4 max-w-[520px] leading-relaxed text-[var(--text-secondary)]">Sign in to create a verified buyer organization, publish RFQs, compare supplier quotations, and follow every protected-trade step.</p>
          <button className="btn btn-primary mt-8" onClick={() => openAuth("login")}>Sign in to continue</button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8 lg:pb-32 lg:pt-40">
      <div className="absolute inset-0 aurion-pattern opacity-[0.1]" />
      <div className="relative mx-auto max-w-[var(--container-wide)]">
        <div className="flex flex-col gap-6 border-b border-[var(--border-subtle)] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="section-label">BUSINESS WORKSPACE</p><h1 className="display-title mt-3">Source, compare, protect.</h1><p className="mt-4 max-w-[650px] leading-relaxed text-[var(--text-secondary)]">One accountable workspace for your organization&apos;s requirements and commercial trades.</p></div>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">Business overview <ArrowRight size={16} /></Link>
        </div>

        {error ? <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-[rgba(224,85,85,0.35)] bg-[rgba(224,85,85,0.08)] p-4 text-sm text-[#ef8c8c]"><WarningCircle size={19} />{error}</div> : null}

        <div className="mt-9 grid gap-6 lg:grid-cols-[0.74fr_1.26fr]">
          <aside className="space-y-6">
            <Panel title="Buyer organization" icon={<Buildings size={20} />}>
              {buyerOrganizations.length ? (
                <>
                  <select className="input" value={selectedOrganization?.id ?? ""} onChange={(event) => setOrganizationId(Number(event.target.value))}>
                    {buyerOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                  </select>
                  {selectedOrganization ? <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm"><div className="flex items-center justify-between"><span className="text-white">Verification</span><span className={selectedOrganization.verificationStatus === "verified" ? "text-[#8de1aa]" : "text-[var(--gold)]"}>{selectedOrganization.verificationStatus}</span></div><p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">Only verified organizations can publish an RFQ or accept a quotation.</p></div> : null}
                </>
              ) : <p className="text-sm leading-relaxed text-[var(--text-secondary)]">Create your organization to begin a structured sourcing request.</p>}
              <form onSubmit={handleCreateOrganization} className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-5">
                <input className="input" required placeholder="Legal or trading name" value={organizationForm.name} onChange={(event) => setOrganizationForm({ ...organizationForm, name: event.target.value })} />
                <input className="input" placeholder="Registration number" value={organizationForm.registration_number} onChange={(event) => setOrganizationForm({ ...organizationForm, registration_number: event.target.value })} />
                <button className="btn btn-outline inline-flex w-full items-center justify-center gap-2" disabled={createOrganization.isPending}><Plus size={16} />{createOrganization.isPending ? "Creating…" : "Add buyer organization"}</button>
              </form>
            </Panel>
            <Panel title="Protected trade promise" icon={<ShieldCheck size={20} />}>
              <div className="space-y-3 text-sm text-[var(--text-secondary)]"><p className="flex gap-2"><CheckCircle size={18} className="mt-0.5 shrink-0 text-[var(--gold)]" />Terms are snapshotted and hashed before acceptance.</p><p className="flex gap-2"><CheckCircle size={18} className="mt-0.5 shrink-0 text-[var(--gold)]" />Provider events, inspections, delivery, and disputes control release.</p></div>
            </Panel>
          </aside>

          <div className="space-y-6">
            <Panel title="New structured RFQ" icon={<FileText size={20} />}>
              <form onSubmit={handleCreateRfq} className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name"><input className="input" required value={rfqForm.company_name} onChange={(event) => setRfqForm({ ...rfqForm, company_name: event.target.value })} placeholder={selectedOrganization?.name ?? "Company"} /></Field>
                <Field label="Contact person"><input className="input" required value={rfqForm.contact_name} onChange={(event) => setRfqForm({ ...rfqForm, contact_name: event.target.value })} placeholder={user.name} /></Field>
                <Field label="Work email"><input className="input" type="email" required value={rfqForm.email} onChange={(event) => setRfqForm({ ...rfqForm, email: event.target.value })} placeholder={user.email} /></Field>
                <Field label="Destination country"><input className="input" required value={rfqForm.country} onChange={(event) => setRfqForm({ ...rfqForm, country: event.target.value })} /></Field>
                <Field label="Wholesale catalogue product"><select className="input" value={rfqForm.product_id ?? ""} onChange={(event) => setRfqForm({ ...rfqForm, product_id: event.target.value ? Number(event.target.value) : undefined })}><option value="">Custom requirement or category</option>{catalogue.data?.products.map((product) => <option key={product.id} value={product.id}>{product.name} · MOQ {product.wholesale?.moq ?? "—"}</option>)}</select></Field>
                <Field label="Product or category"><input className="input" required value={rfqForm.product_interest} onChange={(event) => setRfqForm({ ...rfqForm, product_interest: event.target.value })} placeholder="Specialty coffee" /></Field>
                <Field label="Quantity"><input className="input" required value={rfqForm.estimated_quantity} onChange={(event) => setRfqForm({ ...rfqForm, estimated_quantity: event.target.value })} placeholder="5,000 kg" /></Field>
                <Field label="Incoterm"><select className="input" value={rfqForm.incoterm} onChange={(event) => setRfqForm({ ...rfqForm, incoterm: event.target.value as typeof rfqForm.incoterm })}><option>FOB</option><option>EXW</option><option>CIF</option><option>CFR</option><option>DAP</option></select></Field>
                <Field label="Destination port"><input className="input" value={rfqForm.destination_port} onChange={(event) => setRfqForm({ ...rfqForm, destination_port: event.target.value })} placeholder="Djibouti" /></Field>
                <div className="sm:col-span-2"><Field label="Specifications"><textarea className="input min-h-[110px] resize-y" required value={rfqForm.specifications} onChange={(event) => setRfqForm({ ...rfqForm, specifications: event.target.value })} placeholder="Grade, packaging, inspection requirements, target delivery window…" /></Field></div>
                <div className="sm:col-span-2 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"><input type="checkbox" className="mt-1 accent-[var(--gold)]" checked={rfqForm.inspection_required} onChange={(event) => setRfqForm({ ...rfqForm, inspection_required: event.target.checked })} /><span><span className="block text-white">Require pre-shipment inspection</span><span className="mt-1 block text-xs text-[var(--text-muted)]">A failed inspection blocks shipment and release until remediated or waived by Operations.</span></span></label><button className="btn btn-primary inline-flex items-center justify-center gap-2" disabled={createRfq.isPending || !selectedOrganization}>{createRfq.isPending ? "Saving…" : "Save RFQ"}<ArrowRight size={16} /></button></div>
              </form>
            </Panel>

            <Panel title="Your RFQs" icon={<Clock size={20} />}>
              {rfqs.isLoading ? <LoadingState compact /> : rfqs.data?.length ? <div className="space-y-3">{rfqs.data.map((rfq) => <RfqRow key={rfq.id} rfq={rfq} selected={rfq.id === selectedRfq?.id} onSelect={() => setSelectedRfqId(rfq.id)} onPublish={() => handlePublish(rfq)} publishing={publishRfq.isPending} />)}</div> : <p className="text-sm text-[var(--text-secondary)]">Your first RFQ will appear here.</p>}
            </Panel>

            {selectedRfq ? <Panel title={`Offers for ${selectedRfq.reference}`} icon={<ShieldCheck size={20} />}>
              <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]"><span className="rounded-full border border-white/[0.1] px-3 py-1 uppercase tracking-[0.12em] text-[0.62rem] text-[var(--gold)]">{selectedRfq.status}</span><span>{selectedRfq.invitations.length} supplier invitations</span></div>
              {selectedRfq.quotations?.filter((quote) => quote.status === "submitted").length ? <div className="grid gap-3">{selectedRfq.quotations.filter((quote) => quote.status === "submitted").map((quote) => <div key={quote.id} className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{quote.vendorName} <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">Revision {quote.revision}</span></p><p className="mt-1 text-sm text-[var(--text-secondary)]">{formatMoney(quote.totalCents, quote.currency)} · {quote.leadTimeDays ?? "—"} day lead time · {quote.incoterm ?? "terms pending"}</p></div><button className="btn btn-outline min-h-10" disabled={acceptQuotation.isPending} onClick={() => handleAccept(quote.id)}>Accept quotation</button></div>)}</div> : <div className="rounded-xl border border-dashed border-white/[0.12] p-6 text-sm leading-relaxed text-[var(--text-secondary)]">No submitted quotations yet. Publish the RFQ to invite the top eligible suppliers; exceptions are visible to Operations.</div>}
            </Panel> : null}

            <Panel title="Protected trades" icon={<ShieldCheck size={20} />}>
              {trades.data?.length ? <div className="grid gap-3">{trades.data.map((trade) => <div key={trade.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{trade.reference}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{trade.supplierName} · {formatMoney(trade.totalCents, trade.currency)} · {trade.status.replaceAll("_", " ")}</p></div><Link href={`/trades/${trade.id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--gold)]">Open trade <ArrowRight size={15} /></Link></div>)}</div> : <p className="text-sm text-[var(--text-secondary)]">Accepted quotations become protected trades here.</p>}
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[rgba(9,13,22,0.84)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.2)] sm:p-7"><div className="mb-5 flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4"><span className="text-[var(--gold)]">{icon}</span><h2 className="font-[family-name:var(--font-display)] text-2xl text-white">{title}</h2></div>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}</label>;
}

function RfqRow({ rfq, selected, onSelect, onPublish, publishing }: { rfq: BusinessRFQ; selected: boolean; onSelect: () => void; onPublish: () => void; publishing: boolean }) {
  return <div className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${selected ? "border-[var(--border-gold)] bg-[rgba(214,180,94,0.07)]" : "border-white/[0.08] bg-white/[0.02]"}`}><button className="text-left" onClick={onSelect}><p className="font-semibold text-white">{rfq.reference} <span className="ml-2 text-xs font-normal uppercase tracking-[0.12em] text-[var(--gold)]">{rfq.status}</span></p><p className="mt-1 text-sm text-[var(--text-secondary)]">{rfq.productInterest} · {rfq.estimatedQuantity || "quantity pending"}</p></button>{rfq.status === "new" || rfq.status === "reviewing" ? <button className="btn btn-outline min-h-10" onClick={onPublish} disabled={publishing}>{publishing ? <Spinner className="animate-spin" /> : "Publish & match"}</button> : <span className="text-xs text-[var(--text-muted)]">{rfq.quotations?.length ?? 0} offers</span>}</div>;
}

function LoadingState({ compact = false }: { compact?: boolean }) {
  return <div className={`${compact ? "py-4" : "min-h-[45vh] pt-40"} text-center text-sm text-[var(--text-muted)]`}><Spinner size={24} className="mx-auto animate-spin text-[var(--gold)]" /> <span className="mt-3 block">Loading workspace…</span></div>;
}
