"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Gavel, ShieldCheck, Spinner, Truck } from "@phosphor-icons/react";
import { useBusinessOrganizations, useBusinessTradeOrder, useAcceptDelivery, useOpenTradeDispute, useRequestProtectedPayment, useSandboxFundTrade } from "@/lib/business";
import { useMe } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";

export default function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tradeId = Number(id);
  const { data: user } = useMe();
  const trade = useBusinessTradeOrder(Number.isFinite(tradeId) ? tradeId : null);
  const organizations = useBusinessOrganizations(!!user);
  const requestPayment = useRequestProtectedPayment();
  const sandboxFund = useSandboxFundTrade();
  const acceptDelivery = useAcceptDelivery();
  const openDispute = useOpenTradeDispute();
  const showToast = useUiStore((state) => state.showToast);
  const [disputeDetail, setDisputeDetail] = useState("");
  const [error, setError] = useState("");
  const buyerOrganization = organizations.data?.find((organization) => organization.id === trade.data?.buyerOrganizationId);

  async function run(action: () => Promise<unknown>, message: string) {
    setError("");
    try { await action(); showToast(message, "success"); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "The action could not be completed."); }
  }

  if (trade.isLoading) return <div className="pt-40 text-center text-[var(--text-muted)]"><Spinner size={24} className="mx-auto animate-spin text-[var(--gold)]" /></div>;
  if (!trade.data) return <div className="px-4 pt-40 text-center text-[var(--text-secondary)]">This trade could not be found.</div>;
  const current = trade.data;
  const payment = current.protectedPayment;

  return <section className="px-4 pb-24 pt-32 sm:px-6 lg:px-8 lg:pt-40"><div className="mx-auto max-w-[var(--container-content)]">
    <Link href="/workspace" className="inline-flex items-center gap-2 text-sm text-[var(--gold)]"><ArrowLeft size={16} /> Workspace</Link>
    <div className="mt-7 flex flex-col gap-5 border-b border-[var(--border-subtle)] pb-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="section-label">PROTECTED TRADE</p><h1 className="display-title mt-3">{current.reference}</h1><p className="mt-3 text-[var(--text-secondary)]">{current.supplierName} · {formatMoney(current.totalCents, current.currency)}</p></div><span className="rounded-full border border-[var(--border-gold)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--gold)]">{current.status.replaceAll("_", " ")}</span></div>
    {error ? <div role="alert" className="mt-6 rounded-xl border border-[rgba(224,85,85,0.35)] bg-[rgba(224,85,85,0.08)] p-4 text-sm text-[#ef8c8c]">{error}</div> : null}
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 sm:p-8"><h2 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-2xl text-white"><FileText size={22} className="text-[var(--gold)]" /> Contract record</h2><p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">The accepted terms are immutable. Both parties must accept the exact digest before funding.</p><div className="mt-5 break-all rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 font-[family-name:var(--font-mono)] text-xs text-[var(--gold)]">{current.termsSha256}</div>{current.contractAvailable ? <a className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--gold)] hover:text-white" href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"}/business/trade_orders/${current.id}/contract`} target="_blank" rel="noreferrer">Open contract PDF <ArrowRight size={15} className="ml-2" /></a> : null}<div className="mt-5 grid gap-3 sm:grid-cols-2">{current.acceptances.map((acceptance) => <div key={acceptance.organizationId} className="rounded-xl border border-white/[0.08] p-4 text-sm"><CheckCircle size={18} className="text-[#8de1aa]" /><p className="mt-2 text-white">{acceptance.organizationName}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{acceptance.role} · {new Date(acceptance.acceptedAt).toLocaleString()}</p></div>)}{current.acceptances.length < 2 ? <div className="rounded-xl border border-dashed border-white/[0.12] p-4 text-sm text-[var(--text-muted)]">Waiting for the supplier&apos;s acceptance.</div> : null}</div></section>
        <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 sm:p-8"><h2 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-2xl text-white"><Truck size={22} className="text-[var(--gold)]" /> Delivery and release</h2><div className="mt-6 space-y-4">{[["Funding", payment?.status ?? "not created"], ["Inspection", current.inspection?.status ?? "not required"], ["Shipment", current.shipment?.status ?? "awaiting shipment"], ["Delivery", current.deliveredAt ? "verified" : "awaiting verification"]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-white/[0.07] pb-3 text-sm"><span className="text-[var(--text-secondary)]">{label}</span><span className="text-white">{value}</span></div>)}</div><p className="mt-5 text-xs leading-relaxed text-[var(--text-muted)]">Release is controlled by provider callbacks after buyer acceptance or seven calendar days after verified delivery. An open dispute freezes release.</p></section>
      </div>
      <aside className="space-y-6">
        <section className="rounded-[24px] border border-[var(--border-gold)] bg-[rgba(9,13,22,0.9)] p-6 sm:p-8"><h2 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-2xl text-white"><ShieldCheck size={22} className="text-[var(--gold)]" /> Buyer actions</h2><div className="mt-6 space-y-3"><button className="btn btn-outline w-full" disabled={requestPayment.isPending || current.acceptances.length < 2} onClick={() => run(() => requestPayment.mutateAsync(current.id), "Protected payment intent created.")}>Create protected payment</button><button className="btn btn-primary w-full" disabled={sandboxFund.isPending || !payment || payment.status === "settled"} onClick={() => run(() => sandboxFund.mutateAsync(current.id), "Sandbox funding callback recorded.")}>Fund sandbox trade</button><button className="btn btn-outline w-full" disabled={acceptDelivery.isPending || !buyerOrganization || !current.deliveredAt} onClick={() => run(() => acceptDelivery.mutateAsync({ id: current.id, organizationId: buyerOrganization!.id }), "Delivery acceptance recorded.")}>Accept verified delivery</button></div><p className="mt-5 text-xs leading-relaxed text-[var(--text-muted)]">Sandbox funding is visible only outside production. No button can create live provider-held money.</p></section>
        <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 sm:p-8"><h2 className="flex items-center gap-3 font-[family-name:var(--font-display)] text-2xl text-white"><Gavel size={22} className="text-[var(--gold)]" /> Open a dispute</h2><textarea className="input mt-5 min-h-[110px] resize-y" placeholder="Describe the delivery or quality issue…" value={disputeDetail} onChange={(event) => setDisputeDetail(event.target.value)} /><button className="btn btn-outline mt-3 w-full" disabled={openDispute.isPending || !disputeDetail.trim() || !user || !payment || payment.status === "settled"} onClick={() => run(() => openDispute.mutateAsync({ id: current.id, reason: "buyer_protection", detail: disputeDetail }), "Dispute opened; release is frozen.")}>Open dispute</button></section>
      </aside>
    </div>
  </div></section>;
}
