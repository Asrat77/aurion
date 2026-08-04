"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "@phosphor-icons/react";
import { useCreateRefundRequest, REFUND_REASONS } from "@/lib/refunds";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";
import type { OrderItem, RefundReason } from "@/types";

const REASON_KEYS: Record<RefundReason, string> = {
  not_received: "refund.reasons.notReceived",
  damaged: "refund.reasons.damaged",
  not_as_described: "refund.reasons.notAsDescribed",
  wrong_item: "refund.reasons.wrongItem",
  other: "refund.reasons.other",
};

export default function RequestRefundForm({
  item,
  onDone,
}: {
  item: OrderItem;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const createRefund = useCreateRefundRequest();
  const showToast = useUiStore((s) => s.showToast);

  const [reason, setReason] = useState<RefundReason>("not_received");
  const [detail, setDetail] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createRefund.mutateAsync({
        order_item_id: item.id,
        reason,
        detail: detail || undefined,
      });
      showToast(t("refund.submitted"), "success");
      onDone();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("refund.submitFailed"), "error");
    }
  }

  return (
    <form
      className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-deep)] p-5"
      onSubmit={submit}
    >
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={18} className="text-[var(--gold)]" />
        <p className="section-label">{t("refund.claimTitle")}</p>
      </div>
      <h4 className="text-base font-semibold text-white mb-4">{item.productName}</h4>

      <div className="mb-4">
        <label className="field-label" htmlFor={`reason-${item.id}`}>
          {t("refund.whatWentWrong")} <span className="text-[var(--gold)]">*</span>
        </label>
        <select
          id={`reason-${item.id}`}
          className="input"
          value={reason}
          onChange={(e) => setReason(e.target.value as RefundReason)}
        >
          {REFUND_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {t(REASON_KEYS[r.value])}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="field-label" htmlFor={`detail-${item.id}`}>
          {t("refund.tellMore")}
        </label>
        <textarea
          id={`detail-${item.id}`}
          className="input"
          rows={3}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={2000}
          placeholder={t("refund.detailPlaceholder")}
        />
        <p className="field-help">
          {t("refund.policyLead")} {" "}
          <Link href="/buyer-protection" className="text-[var(--gold)] hover:underline">
            {t("refund.policy")}
          </Link>
          .
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-outline" onClick={onDone}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary" disabled={createRefund.isPending}>
          {createRefund.isPending ? t("refund.submitting") : t("refund.submitClaim")}
        </button>
      </div>
    </form>
  );
}
