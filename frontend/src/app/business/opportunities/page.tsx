"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, ClipboardText, Spinner, WarningCircle } from "@phosphor-icons/react";
import { useBusinessOpportunities, useCreateBusinessQuotation, useSubmitBusinessQuotation } from "@/lib/business";
import { useMe } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";

/**
 * The supplier side of matching. The score and the reason codes that won the
 * invitation stay on screen while the offer is prepared, so a supplier can see
 * what the buyer's requirement actually rewarded.
 */
export default function OpportunitiesPage() {
  const { data: user } = useMe();
  const opportunities = useBusinessOpportunities(!!user);
  const createQuotation = useCreateBusinessQuotation();
  const submitQuotation = useSubmitBusinessQuotation();
  const showToast = useUiStore((state) => state.showToast);
  const openAuth = useUiStore((state) => state.openAuth);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    description: "",
    quantity: "",
    unit_price_cents: "",
    lead_time_days: "",
    shipping_cents: "0",
    note: "",
  });
  const [error, setError] = useState("");

  const selected = opportunities.data?.find((opportunity) => opportunity.id === selectedId);

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
          items: [
            {
              description: form.description,
              quantity: Number(form.quantity),
              unit_price_cents: Number(form.unit_price_cents),
            },
          ],
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

  if (!user) {
    return (
      <section className="mx-auto max-w-[var(--container-narrow)] px-4 py-20 text-center sm:px-6">
        <div className="b-panel p-10">
          <ClipboardText size={32} className="mx-auto text-[var(--b-navy)]" />
          <h1 className="display-title mt-4">Supplier opportunities</h1>
          <p className="mx-auto mt-3 max-w-[420px] text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
            Sign in with an approved supplier account to see the requirements you have been matched to.
          </p>
          <button className="btn btn-primary mt-6" onClick={() => openAuth("login")}>
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="border-b border-[var(--b-line)] pb-6">
        <p className="b-eyebrow">Supplier desk</p>
        <h1 className="display-title mt-2">Requirements you were matched to</h1>
        <p className="mt-2.5 max-w-[580px] text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
          A submitted quotation is immutable. If your terms change, submit a new revision rather than editing the one
          the buyer is already comparing.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[rgba(179,38,30,0.3)] bg-[rgba(179,38,30,0.06)] p-3.5 text-[0.85rem] text-[var(--danger)]"
        >
          <WarningCircle size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-3">
          {opportunities.isLoading ? (
            <p className="flex items-center gap-2 text-[0.85rem] text-[var(--text-muted)]">
              <Spinner size={15} className="animate-spin" /> Loading opportunities
            </p>
          ) : opportunities.data?.length ? (
            opportunities.data.map((opportunity) => (
              <button
                key={opportunity.id}
                onClick={() => setSelectedId(opportunity.id)}
                aria-pressed={selectedId === opportunity.id}
                className={`b-panel w-full p-4 text-left transition-colors ${
                  selectedId === opportunity.id ? "border-[var(--b-navy)] bg-[var(--b-tint)]" : "hover:bg-[var(--b-tint)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-[family-name:var(--font-mono)] text-[0.82rem] text-[var(--text-primary)]">
                    {opportunity.reference}
                  </span>
                  <span className="b-chip b-chip-navy">Match score {opportunity.score}</span>
                </div>
                {opportunity.reasons.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {opportunity.reasons.map((reason) => (
                      <span key={reason} className="b-chip">
                        {reason}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2.5 text-[0.76rem] text-[var(--text-muted)]">
                  {opportunity.status}
                  {opportunity.invitedAt ? ` · invited ${new Date(opportunity.invitedAt).toLocaleDateString()}` : ""}
                </p>
              </button>
            ))
          ) : (
            <div className="b-panel p-8 text-[0.85rem] text-[var(--text-secondary)]">
              No matched opportunities are waiting for your supplier account. Adding verified capabilities for a
              category, destination and quantity range makes you eligible for more requirements.
            </div>
          )}
        </div>

        <div className="b-panel">
          {selected ? (
            <>
              <div className="b-panel-head">
                <div>
                  <span className="b-panel-title">Submit a quotation</span>
                  <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--text-muted)]">
                    {selected.reference}
                  </p>
                </div>
                <span className="b-chip b-chip-navy">Score {selected.score}</span>
              </div>
              <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Line description">
                    <input
                      className="input"
                      required
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Quantity">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  />
                </Field>
                <Field label="Unit price (minor units)">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    required
                    value={form.unit_price_cents}
                    onChange={(event) => setForm({ ...form, unit_price_cents: event.target.value })}
                  />
                </Field>
                <Field label="Lead time (days)">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={form.lead_time_days}
                    onChange={(event) => setForm({ ...form, lead_time_days: event.target.value })}
                  />
                </Field>
                <Field label="Shipping (minor units)">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.shipping_cents}
                    onChange={(event) => setForm({ ...form, shipping_cents: event.target.value })}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Commercial note">
                    <textarea
                      className="input min-h-[90px] resize-y"
                      value={form.note}
                      onChange={(event) => setForm({ ...form, note: event.target.value })}
                    />
                  </Field>
                </div>
                <button
                  className="btn btn-primary inline-flex items-center justify-center gap-2 sm:col-span-2"
                  disabled={createQuotation.isPending || submitQuotation.isPending}
                >
                  {createQuotation.isPending || submitQuotation.isPending ? "Submitting" : "Submit immutable quotation"}
                  <ArrowRight size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <ClipboardText size={32} className="text-[var(--b-navy)]" />
              <h2 className="mt-4 text-[1.05rem] font-semibold text-[var(--text-primary)]">Select an opportunity</h2>
              <p className="mt-2 max-w-[320px] text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
                Your match score and the reason codes that earned the invitation stay visible while you prepare the
                offer.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
