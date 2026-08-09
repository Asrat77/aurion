"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Buildings,
  ClipboardText,
  Plus,
  SealCheck,
  ShieldCheck,
  Spinner,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  useAcceptBusinessQuotation,
  useBusinessCatalogue,
  useBusinessOrganizations,
  useBusinessRFQs,
  useBusinessTradeOrders,
  useCreateBusinessOrganization,
  useCreateBusinessRFQ,
  usePublishBusinessRFQ,
} from "@/lib/business";
import { businessHref } from "@/lib/channel";
import { formatMoney } from "@/lib/money";
import { useUiStore } from "@/store/ui";
import MatchConsole from "@/components/business/MatchConsole";
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

export default function RfqWorkspacePage() {
  return (
    <Suspense fallback={<Loading />}>
      <RfqWorkspace />
    </Suspense>
  );
}

function RfqWorkspace() {
  const params = useSearchParams();
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
  // Arriving from the catalogue with ?product= pre-attaches that line.
  const [rfqForm, setRfqForm] = useState(() => {
    const requested = params.get("product");
    return requested ? { ...EMPTY_RFQ, product_id: Number(requested) } : EMPTY_RFQ;
  });
  const [organizationForm, setOrganizationForm] = useState({ name: "", registration_number: "", country: "Ethiopia" });
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [error, setError] = useState("");

  const buyerOrganizations = useMemo(
    () => (organizations.data ?? []).filter((organization) => organization.kind === "buyer"),
    [organizations.data],
  );
  const selectedOrganization =
    buyerOrganizations.find((organization) => organization.id === organizationId) ?? buyerOrganizations[0];
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
      setOrganizationForm({ name: "", registration_number: "", country: "Ethiopia" });
      setShowOrganizationForm(false);
      showToast("Organization created. Verification is required before publishing.", "success");
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
      setRfqForm({
        ...EMPTY_RFQ,
        company_name: selectedOrganization.name,
        contact_name: user?.name ?? "",
        email: user?.email ?? "",
      });
      showToast("RFQ saved. Publish it to invite matching suppliers.", "success");
    } catch (caught) {
      fail(caught);
    }
  }

  async function handlePublish(rfq: BusinessRFQ) {
    setError("");
    try {
      await publishRfq.mutateAsync(rfq.id);
      setSelectedRfqId(rfq.id);
      showToast("RFQ published. Matching suppliers have been invited.", "success");
    } catch (caught) {
      fail(caught);
    }
  }

  async function handleAccept(quotationId: number) {
    if (!selectedOrganization) return;
    setError("");
    try {
      await acceptQuotation.mutateAsync({ quotationId, organizationId: selectedOrganization.id });
      showToast("Quotation accepted. The contract is ready for both parties.", "success");
    } catch (caught) {
      fail(caught);
    }
  }

  if (userLoading) return <Loading />;

  if (!user) {
    return (
      <section className="mx-auto max-w-[var(--container-narrow)] px-4 py-20 text-center sm:px-6">
        <div className="b-panel p-10">
          <ShieldCheck size={34} className="mx-auto text-[var(--b-navy)]" />
          <h1 className="display-title mt-4">Your sourcing workspace</h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
            Sign in to create a buyer organization, publish requirements, see how suppliers were scored, and follow each
            protected trade.
          </p>
          <button className="btn btn-primary mt-6" onClick={() => openAuth("login")}>
            Sign in to continue
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[var(--container-wide)] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--b-line)] pb-6">
        <div>
          <p className="b-eyebrow">Sourcing workspace</p>
          <h1 className="display-title mt-2">Requirements, offers and trades</h1>
        </div>
        <Link href={businessHref("/catalogue")} className="b-link text-[0.85rem]">
          Browse the wholesale catalogue
        </Link>
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[290px_1fr]">
        <aside className="space-y-4">
          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">Buyer organization</span>
              <Buildings size={16} className="text-[var(--b-navy)]" />
            </div>
            <div className="p-4">
              {buyerOrganizations.length ? (
                <>
                  <label className="sr-only" htmlFor="organization">
                    Select organization
                  </label>
                  <select
                    id="organization"
                    className="input"
                    value={selectedOrganization?.id ?? ""}
                    onChange={(event) => setOrganizationId(Number(event.target.value))}
                  >
                    {buyerOrganizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                  {selectedOrganization ? (
                    <div className="mt-3 flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--b-tint)] px-3 py-2.5">
                      <span className="text-[0.8rem] text-[var(--text-secondary)]">Verification</span>
                      <span
                        className={`b-chip ${
                          selectedOrganization.verificationStatus === "verified" ? "b-chip-verified" : "b-chip-pending"
                        }`}
                      >
                        {selectedOrganization.verificationStatus === "verified" ? <SealCheck size={11} weight="fill" /> : null}
                        {selectedOrganization.verificationStatus}
                      </span>
                    </div>
                  ) : null}
                  <p className="mt-2.5 text-[0.74rem] leading-relaxed text-[var(--text-muted)]">
                    Only a verified organization can publish an RFQ or accept a quotation.
                  </p>
                </>
              ) : (
                <p className="text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
                  Create your organization to begin a structured sourcing request.
                </p>
              )}

              {showOrganizationForm ? (
                <form onSubmit={handleCreateOrganization} className="mt-4 space-y-2.5 border-t border-[var(--b-line)] pt-4">
                  <input
                    className="input"
                    required
                    placeholder="Legal or trading name"
                    value={organizationForm.name}
                    onChange={(event) => setOrganizationForm({ ...organizationForm, name: event.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Registration number"
                    value={organizationForm.registration_number}
                    onChange={(event) =>
                      setOrganizationForm({ ...organizationForm, registration_number: event.target.value })
                    }
                  />
                  <button className="btn btn-primary w-full" disabled={createOrganization.isPending}>
                    {createOrganization.isPending ? "Creating" : "Create organization"}
                  </button>
                </form>
              ) : (
                <button
                  className="btn btn-outline mt-4 inline-flex w-full items-center justify-center gap-1.5"
                  onClick={() => setShowOrganizationForm(true)}
                >
                  <Plus size={14} /> Add organization
                </button>
              )}
            </div>
          </div>

          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">Your requirements</span>
              <span className="b-eyebrow">{rfqs.data?.length ?? 0}</span>
            </div>
            {rfqs.isLoading ? (
              <p className="p-4 text-[0.82rem] text-[var(--text-muted)]">Loading</p>
            ) : rfqs.data?.length ? (
              <ul className="max-h-[420px] overflow-y-auto">
                {rfqs.data.map((rfq) => (
                  <li key={rfq.id} className="border-b border-[var(--b-line)] last:border-0">
                    <button
                      onClick={() => setSelectedRfqId(rfq.id)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        rfq.id === selectedRfq?.id ? "bg-[var(--b-tint)]" : "hover:bg-[var(--b-tint)]"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-[family-name:var(--font-mono)] text-[0.78rem] text-[var(--text-primary)]">
                          {rfq.reference}
                        </span>
                        <span className="b-chip shrink-0">{rfq.status}</span>
                      </span>
                      <span className="mt-1 block truncate text-[0.8rem] text-[var(--text-secondary)]">
                        {rfq.productInterest}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-[0.82rem] text-[var(--text-secondary)]">Your first requirement will appear here.</p>
            )}
          </div>
        </aside>

        <div className="space-y-5">
          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">New request for quotation</span>
              <ClipboardText size={16} className="text-[var(--b-navy)]" />
            </div>
            <form onSubmit={handleCreateRfq} className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Company name">
                <input
                  className="input"
                  required
                  value={rfqForm.company_name}
                  placeholder={selectedOrganization?.name ?? "Company"}
                  onChange={(event) => setRfqForm({ ...rfqForm, company_name: event.target.value })}
                />
              </Field>
              <Field label="Contact person">
                <input
                  className="input"
                  required
                  value={rfqForm.contact_name}
                  placeholder={user.name}
                  onChange={(event) => setRfqForm({ ...rfqForm, contact_name: event.target.value })}
                />
              </Field>
              <Field label="Work email">
                <input
                  className="input"
                  type="email"
                  required
                  value={rfqForm.email}
                  placeholder={user.email}
                  onChange={(event) => setRfqForm({ ...rfqForm, email: event.target.value })}
                />
              </Field>
              <Field label="Destination country">
                <input
                  className="input"
                  required
                  value={rfqForm.country}
                  onChange={(event) => setRfqForm({ ...rfqForm, country: event.target.value })}
                />
              </Field>
              <Field label="Catalogue product">
                <select
                  className="input"
                  value={rfqForm.product_id ?? ""}
                  onChange={(event) =>
                    setRfqForm({ ...rfqForm, product_id: event.target.value ? Number(event.target.value) : undefined })
                  }
                >
                  <option value="">Custom requirement or category</option>
                  {catalogue.data?.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · MOQ {product.wholesale?.moq ?? "—"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Product or category">
                <input
                  className="input"
                  required
                  value={rfqForm.product_interest}
                  placeholder="Specialty coffee"
                  onChange={(event) => setRfqForm({ ...rfqForm, product_interest: event.target.value })}
                />
              </Field>
              <Field label="Quantity">
                <input
                  className="input"
                  required
                  value={rfqForm.estimated_quantity}
                  placeholder="5,000 kg"
                  onChange={(event) => setRfqForm({ ...rfqForm, estimated_quantity: event.target.value })}
                />
              </Field>
              <Field label="Incoterm">
                <select
                  className="input"
                  value={rfqForm.incoterm}
                  onChange={(event) => setRfqForm({ ...rfqForm, incoterm: event.target.value as typeof rfqForm.incoterm })}
                >
                  <option>FOB</option>
                  <option>EXW</option>
                  <option>CIF</option>
                  <option>CFR</option>
                  <option>DAP</option>
                </select>
              </Field>
              <Field label="Destination port">
                <input
                  className="input"
                  value={rfqForm.destination_port}
                  placeholder="Djibouti"
                  onChange={(event) => setRfqForm({ ...rfqForm, destination_port: event.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Specifications">
                  <textarea
                    className="input min-h-[96px] resize-y"
                    required
                    value={rfqForm.specifications}
                    placeholder="Grade, packaging, inspection requirements, target delivery window"
                    onChange={(event) => setRfqForm({ ...rfqForm, specifications: event.target.value })}
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-4 border-t border-[var(--b-line)] pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-start gap-2.5 text-[0.82rem] text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--b-navy)]"
                    checked={rfqForm.inspection_required}
                    onChange={(event) => setRfqForm({ ...rfqForm, inspection_required: event.target.checked })}
                  />
                  <span>
                    <span className="block font-semibold text-[var(--text-primary)]">
                      Require pre-shipment inspection
                    </span>
                    <span className="mt-0.5 block text-[0.75rem] text-[var(--text-muted)]">
                      A failed inspection blocks shipment and release until remediated or waived.
                    </span>
                  </span>
                </label>
                <button
                  className="btn btn-primary inline-flex shrink-0 items-center justify-center gap-2"
                  disabled={createRfq.isPending || !selectedOrganization}
                >
                  {createRfq.isPending ? "Saving" : "Save requirement"} <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>

          {selectedRfq ? (
            <>
              <div className="b-panel">
                <div className="b-panel-head">
                  <div>
                    <span className="b-panel-title">Supplier match console</span>
                    <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--text-muted)]">
                      {selectedRfq.reference}
                    </p>
                  </div>
                  {selectedRfq.status === "new" || selectedRfq.status === "reviewing" ? (
                    <button
                      className="btn btn-primary shrink-0"
                      onClick={() => handlePublish(selectedRfq)}
                      disabled={publishRfq.isPending}
                    >
                      {publishRfq.isPending ? "Publishing" : "Publish and match"}
                    </button>
                  ) : (
                    <span className="b-chip b-chip-navy">{selectedRfq.status}</span>
                  )}
                </div>
                <MatchConsole rfqId={selectedRfq.id} />
              </div>

              <div className="b-panel">
                <div className="b-panel-head">
                  <span className="b-panel-title">Competing offers</span>
                  <span className="b-eyebrow">
                    {selectedRfq.quotations?.filter((quote) => quote.status === "submitted").length ?? 0} submitted
                  </span>
                </div>
                {selectedRfq.quotations?.filter((quote) => quote.status === "submitted").length ? (
                  <div className="overflow-x-auto p-4">
                    <table className="data-table min-w-[560px]">
                      <thead>
                        <tr>
                          <th>Supplier</th>
                          <th>Revision</th>
                          <th>Lead time</th>
                          <th>Terms</th>
                          <th className="num">Total</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRfq.quotations
                          .filter((quote) => quote.status === "submitted")
                          .map((quote) => (
                            <tr key={quote.id}>
                              <td className="font-semibold">{quote.vendorName}</td>
                              <td>{quote.revision}</td>
                              <td>{quote.leadTimeDays ? `${quote.leadTimeDays} days` : "—"}</td>
                              <td>{quote.incoterm ?? "pending"}</td>
                              <td className="num">{formatMoney(quote.totalCents, quote.currency)}</td>
                              <td>
                                <button
                                  className="btn btn-outline"
                                  disabled={acceptQuotation.isPending}
                                  onClick={() => handleAccept(quote.id)}
                                >
                                  Accept
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-5 text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
                    No submitted quotations yet. Publish the requirement to invite the top eligible suppliers; thin or
                    empty shortlists are escalated to Operations automatically.
                  </p>
                )}
              </div>
            </>
          ) : null}

          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">Protected trades</span>
              <span className="b-eyebrow">{trades.data?.length ?? 0}</span>
            </div>
            {trades.data?.length ? (
              <ul>
                {trades.data.map((trade) => (
                  <li
                    key={trade.id}
                    className="flex flex-col gap-2 border-b border-[var(--b-line)] px-5 py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-[family-name:var(--font-mono)] text-[0.82rem] text-[var(--text-primary)]">
                        {trade.reference}
                      </p>
                      <p className="mt-0.5 text-[0.82rem] text-[var(--text-secondary)]">
                        {trade.supplierName} · {formatMoney(trade.totalCents, trade.currency)} ·{" "}
                        {trade.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <Link href={businessHref(`/trades/${trade.id}`)} className="b-link shrink-0 text-[0.82rem]">
                      Open trade
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-[0.85rem] text-[var(--text-secondary)]">
                Accepted quotations become protected trades here.
              </p>
            )}
          </div>
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

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-[0.85rem] text-[var(--text-muted)]">
      <Spinner size={18} className="animate-spin" /> Loading workspace
    </div>
  );
}
