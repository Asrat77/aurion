"use client";

import { useState } from "react";
import { useCreateReview } from "@/lib/reviews";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";
import { StarPicker } from "@/components/reviews/StarRating";
import { useTranslation } from "react-i18next";
import type { PendingReview } from "@/types";

export default function WriteReviewForm({
  pending,
  onDone,
}: {
  pending: PendingReview;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const createReview = useCreateReview();
  const showToast = useUiStore((s) => s.showToast);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;

    try {
      await createReview.mutateAsync({
        order_item_id: pending.orderItemId,
        rating,
        title: title || undefined,
        body: body || undefined,
      });
      showToast(t("reviews.thanks"), "success");
      onDone();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("errors.couldNotReview"), "error");
    }
  }

  return (
    <form
      className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-deep)] p-5"
      onSubmit={submit}
    >
      <p className="section-label mb-1">{t("reviews.reviewYourPurchase")}</p>
      <h4 className="text-base font-semibold text-white mb-4">{pending.productName}</h4>

      <div className="mb-4">
        <label className="field-label" id={`rating-label-${pending.orderItemId}`}>
          {t("reviews.yourRating")} <span className="text-[var(--gold)]">*</span>
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="field-label" htmlFor={`title-${pending.orderItemId}`}>
          {t("reviews.headline")}
        </label>
        <input
          id={`title-${pending.orderItemId}`}
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={t("reviews.headlinePlaceholder")}
        />
      </div>

      <div className="mb-4">
        <label className="field-label" htmlFor={`body-${pending.orderItemId}`}>
          {t("reviews.yourReview")}
        </label>
        <textarea
          id={`body-${pending.orderItemId}`}
          className="input"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder={t("reviews.bodyPlaceholder")}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-outline" onClick={onDone}>
          {t("reviews.notNow")}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={rating === 0 || createReview.isPending}
        >
          {createReview.isPending ? t("reviews.posting") : t("reviews.post")}
        </button>
      </div>
    </form>
  );
}
