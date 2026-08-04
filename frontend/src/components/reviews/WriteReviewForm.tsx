"use client";

import { useState } from "react";
import { useCreateReview } from "@/lib/reviews";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";
import { StarPicker } from "@/components/reviews/StarRating";
import type { PendingReview } from "@/types";

export default function WriteReviewForm({
  pending,
  onDone,
}: {
  pending: PendingReview;
  onDone: () => void;
}) {
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
      showToast("Thank you — your review is live.", "success");
      onDone();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not post your review.", "error");
    }
  }

  return (
    <form
      className="rounded-xl border border-[var(--border-gold)] bg-[var(--bg-deep)] p-5"
      onSubmit={submit}
    >
      <p className="section-label mb-1">Review your purchase</p>
      <h4 className="text-base font-semibold text-white mb-4">{pending.productName}</h4>

      <div className="mb-4">
        <label className="field-label" id={`rating-label-${pending.orderItemId}`}>
          Your rating <span className="text-[var(--gold)]">*</span>
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="field-label" htmlFor={`title-${pending.orderItemId}`}>
          Headline
        </label>
        <input
          id={`title-${pending.orderItemId}`}
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Sum it up in a few words"
        />
      </div>

      <div className="mb-4">
        <label className="field-label" htmlFor={`body-${pending.orderItemId}`}>
          Your review
        </label>
        <textarea
          id={`body-${pending.orderItemId}`}
          className="input"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="How was the quality, the packaging, the delivery?"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-outline" onClick={onDone}>
          Not now
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={rating === 0 || createReview.isPending}
        >
          {createReview.isPending ? "Posting…" : "Post review"}
        </button>
      </div>
    </form>
  );
}
