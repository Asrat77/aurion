"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, ClipboardText, Spinner } from "@phosphor-icons/react";
import { useBusinessOpportunities, useCreateBusinessQuotation, useSubmitBusinessQuotation } from "@/lib/business";
import { useMe } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";

export default function OpportunitiesPage() {
  const { data: user } = useMe();
  const opportunities = useBusinessOpportunities(!!user);
  const createQuotation = useCreateBusinessQuotation();
  const submitQuotation = useSubmitBusinessQuotation();
  const showToast = useUiStore((state) => state.showToast);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ description: "", quantity: "", unit_price_cents: "", lead_time_days: "", shipping_cents: "0", note: "" });
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    setError("");
    try {
      const quotation = await createQuotation.mutateAsync({
        opportunityId: selectedId,
        input: {
          currency: "USD",
          shipping_cents: Number(form.shipping_cents) || 0,
          lead_time_days: Number(form.lead_time_days) || null,
          note: form.note,
          items: [{ description: form.description, quantity: Number(form.quantity), unit_price_cents: Number(form.unit_price_cents) }],
        },
      });
      await submitQuotation.mutateAsync(quotation.id);
      showToast("Quotation submitted to the buyer.", "success");
      setForm({ description: "", quantity: "", unit_price_cents: "", lead_time_days: "", shipping_cents: "0", note: "" });
      setSelectedId(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The quotation could not be submitted.");
    }
  }

  if (!user) return <section className="px-4 pb-24 pt-40 text-center text-[var(--text-secondary)]">Sign in with an approved supplier account to view opportunities.</section>;
  return <section className="px-4 pb-24 pt-32 sm:px-6 lg:px-8 lg:pt-40"><div className="mx-auto max-w-[var(--container-wide)]"><p className="section-label">SUPPLIER DESK</p><h1 className="display-title mt-3">Open opportunities.</h1><p className="mt-4 max-w-[650px] leading-relaxed text-[var(--text-secondary)]">Review the requirements you were matched to and submit immutable commercial revisions.</p>{error ? <div className="mt-6 rounded-xl border border-[rgba(224,85,85,0.35)] bg-[rgba(224,85,85,0.08)] p-4 text-sm text-[#ef8c8c]">{error}</div> : null}<div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
    <div className="space-y-3">{opportunities.isLoading ? <Spinner className="animate-spin text-[var(--gold)]" /> : opportunities.data?.length ? opportunities.data.map((opportunity) => <button key={opportunity.id} onClick={() => setSelectedId(opportunity.id)} className={`w-full rounded-2xl border p-5 text-left ${selectedId === opportunity.id ? "border-[var(--border-gold)] bg-[rgba(214,180,94,0.07)]" : "border-[var(--border-subtle)] bg-[var(--bg-card)]"}`}><div className="flex items-center justify-between"><span className="font-semibold text-white">{opportunity.reference}</span><span className="text-xs uppercase tracking-[0.14em] text-[var(--gold)]">Score {opportunity.score}</span></div><p className="mt-2 text-sm text-[var(--text-secondary)]">{opportunity.reasons.join(" · ")}</p></button>) : <div className="rounded-2xl border border-dashed border-white/[0.12] p-7 text-sm text-[var(--text-secondary)]">No matched opportunities are waiting for your supplier account.</div>}</div>
    <div className="rounded-[24px] border border-[var(--border-gold)] bg-[rgba(9,13,22,0.88)] p-6 sm:p-8">{selectedId ? <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><h2 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-2xl text-white"><ClipboardText size={22} className="text-[var(--gold)]" /> Submit quotation</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">The submitted revision cannot be edited. Create a new revision if your terms change.</p></div><label><span className="field-label">Line description</span><input className="input" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label><span className="field-label">Quantity</span><input className="input" type="number" min="1" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label><span className="field-label">Unit price (minor units)</span><input className="input" type="number" min="1" required value={form.unit_price_cents} onChange={(event) => setForm({ ...form, unit_price_cents: event.target.value })} /></label><label><span className="field-label">Lead time (days)</span><input className="input" type="number" min="1" value={form.lead_time_days} onChange={(event) => setForm({ ...form, lead_time_days: event.target.value })} /></label><label><span className="field-label">Shipping (minor units)</span><input className="input" type="number" min="0" value={form.shipping_cents} onChange={(event) => setForm({ ...form, shipping_cents: event.target.value })} /></label><div className="sm:col-span-2"><label><span className="field-label">Commercial note</span><textarea className="input min-h-[100px] resize-y" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label></div><button className="btn btn-primary sm:col-span-2 inline-flex items-center justify-center gap-2" disabled={createQuotation.isPending || submitQuotation.isPending}>{createQuotation.isPending || submitQuotation.isPending ? "Submitting…" : "Submit immutable quotation"}<ArrowRight size={16} /></button></form> : <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><ClipboardText size={38} className="text-[var(--gold)]" /><h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl text-white">Select an opportunity</h2><p className="mt-2 max-w-[340px] text-sm leading-relaxed text-[var(--text-secondary)]">Your supplier match score and reason codes stay visible while you prepare the offer.</p></div>}</div>
  </div></div></section>;
}
