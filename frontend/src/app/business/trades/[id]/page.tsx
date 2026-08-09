"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  FileText,
  Gavel,
  ShieldCheck,
  Spinner,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  useAcceptDelivery,
  useBusinessOrganizations,
  useBusinessTradeOrder,
  useOpenTradeDispute,
  useRequestProtectedPayment,
  useSandboxFundTrade,
} from "@/lib/business";
import { useMe } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { businessHref } from "@/lib/channel";
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

  const buyerOrganization = organizations.data?.find(
    (organization) => organization.id === trade.data?.buyerOrganizationId,
  );

  async function run(action: () => Promise<unknown>, message: string) {
    setError("");
    try {
      await action();
      showToast(message, "success");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The action could not be completed.");
    }
  }

  if (trade.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-[0.85rem] text-[var(--text-muted)]">
        <Spinner size={18} className="animate-spin" /> Loading trade
      </div>
    );
  }

  if (!trade.data) {
    return <div className="px-4 py-24 text-center text-[0.88rem] text-[var(--text-secondary)]">This trade could not be found.</div>;
  }

  const current = trade.data;
  const payment = current.protectedPayment;

  // Each stage is either evidenced or it is not. Nothing here is inferred from
  // the stage before it.
  const stages = [
    { label: "Contract accepted by both parties", done: current.acceptances.length >= 2 },
    { label: "Protected payment funded", done: payment?.status === "funded" || payment?.status === "settled" },
    {
      label: "Inspection cleared",
      done: current.inspection ? current.inspection.status === "passed" || current.inspection.status === "waived" : true,
      skipped: !current.inspection,
    },
    { label: "Shipment recorded", done: !!current.shipment },
    { label: "Delivery verified", done: !!current.deliveredAt },
    { label: "Funds released", done: payment?.status === "settled" },
  ];

  return (
    <section className="mx-auto max-w-[var(--container-content)] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <Link href={businessHref("/rfqs")} className="inline-flex items-center gap-1.5 text-[0.82rem] text-[var(--b-navy)]">
        <ArrowLeft size={14} /> Sourcing workspace
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--b-line)] pb-6">
        <div>
          <p className="b-eyebrow">Protected trade</p>
          <h1 className="display-title mt-2 font-[family-name:var(--font-mono)]">{current.reference}</h1>
          <p className="mt-1.5 text-[0.88rem] text-[var(--text-secondary)]">
            {current.supplierName} · {formatMoney(current.totalCents, current.currency)}
          </p>
        </div>
        <span className="b-chip b-chip-navy">{current.status.replaceAll("_", " ")}</span>
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">Trade progress</span>
              <Truck size={16} className="text-[var(--b-navy)]" />
            </div>
            <ol className="p-5">
              {stages.map((stage) => (
                <li key={stage.label} className="flex items-center gap-3 border-b border-[var(--b-line)] py-2.5 last:border-0">
                  {stage.done ? (
                    <CheckCircle size={17} weight="fill" className="shrink-0 text-[var(--b-verified)]" />
                  ) : (
                    <Circle size={17} className="shrink-0 text-[var(--text-muted)]" />
                  )}
                  <span className={`text-[0.85rem] ${stage.done ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                    {stage.label}
                    {stage.skipped ? <span className="ml-2 b-chip">not required</span> : null}
                  </span>
                </li>
              ))}
            </ol>
            <p className="border-t border-[var(--b-line)] px-5 py-3.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
              Release follows a provider callback after buyer acceptance, or seven calendar days after verified delivery
              with no open dispute. An open dispute freezes release.
            </p>
          </div>

          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">Contract record</span>
              <FileText size={16} className="text-[var(--b-navy)]" />
            </div>
            <div className="p-5">
              <p className="text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
                The accepted terms are immutable. Both parties accept the exact digest below before funding.
              </p>
              <p className="mt-3 break-all rounded-[var(--radius-md)] bg-[var(--b-tint)] p-3 font-[family-name:var(--font-mono)] text-[0.7rem] text-[var(--b-navy)]">
                {current.termsSha256}
              </p>
              {current.contractAvailable ? (
                <a
                  className="b-link mt-3 inline-block text-[0.82rem]"
                  href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"}/business/trade_orders/${current.id}/contract`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open contract PDF
                </a>
              ) : null}

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {current.acceptances.map((acceptance) => (
                  <div key={acceptance.organizationId} className="rounded-[var(--radius-md)] border border-[var(--b-line)] p-3">
                    <CheckCircle size={15} weight="fill" className="text-[var(--b-verified)]" />
                    <p className="mt-1.5 text-[0.85rem] font-semibold text-[var(--text-primary)]">
                      {acceptance.organizationName}
                    </p>
                    <p className="mt-0.5 text-[0.72rem] text-[var(--text-muted)]">
                      {acceptance.role} · {new Date(acceptance.acceptedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {current.acceptances.length < 2 ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--b-line)] p-3 text-[0.8rem] text-[var(--text-muted)]">
                    Waiting for the counterparty&apos;s acceptance.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">Buyer actions</span>
              <ShieldCheck size={16} className="text-[var(--b-navy)]" />
            </div>
            <div className="space-y-2.5 p-5">
              <button
                className="btn btn-outline w-full"
                disabled={requestPayment.isPending || current.acceptances.length < 2}
                onClick={() => run(() => requestPayment.mutateAsync(current.id), "Protected payment intent created.")}
              >
                Create protected payment
              </button>
              <button
                className="btn btn-primary w-full"
                disabled={sandboxFund.isPending || !payment || payment.status === "settled"}
                onClick={() => run(() => sandboxFund.mutateAsync(current.id), "Sandbox funding callback recorded.")}
              >
                Fund sandbox trade
              </button>
              <button
                className="btn btn-outline w-full"
                disabled={acceptDelivery.isPending || !buyerOrganization || !current.deliveredAt}
                onClick={() =>
                  run(
                    () => acceptDelivery.mutateAsync({ id: current.id, organizationId: buyerOrganization!.id }),
                    "Delivery acceptance recorded.",
                  )
                }
              >
                Accept verified delivery
              </button>
              <p className="pt-1 text-[0.72rem] leading-relaxed text-[var(--text-muted)]">
                Sandbox funding exists only outside production. No button in this product can create provider-held funds.
              </p>
            </div>
          </div>

          <div className="b-panel">
            <div className="b-panel-head">
              <span className="b-panel-title">Open a dispute</span>
              <Gavel size={16} className="text-[var(--b-navy)]" />
            </div>
            <div className="p-5">
              <label className="sr-only" htmlFor="dispute-detail">
                Describe the issue
              </label>
              <textarea
                id="dispute-detail"
                className="input min-h-[96px] resize-y"
                placeholder="Describe the delivery or quality issue"
                value={disputeDetail}
                onChange={(event) => setDisputeDetail(event.target.value)}
              />
              <button
                className="btn btn-outline mt-3 w-full"
                disabled={openDispute.isPending || !disputeDetail.trim() || !payment || payment.status === "settled"}
                onClick={() =>
                  run(
                    () =>
                      openDispute.mutateAsync({ id: current.id, reason: "buyer_protection", detail: disputeDetail }),
                    "Dispute opened. Release is frozen.",
                  )
                }
              >
                Open dispute
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
