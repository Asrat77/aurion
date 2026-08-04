"use client";

import { Star } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

/** Read-only star display. Rounded to the nearest half for the fill count. */
export function StarRating({
  rating,
  size = 16,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const filled = Math.round(rating);

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          weight={i <= filled ? "fill" : "regular"}
          className={i <= filled ? "text-[var(--gold)]" : "text-[var(--text-muted)]"}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Interactive star picker used when writing a review. */
export function StarPicker({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={t("filters.rating")}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} ${t("reviews.star", { count: i })}`}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/[0.04]"
          onClick={() => onChange(i)}
        >
          <Star
            size={size}
            weight={i <= value ? "fill" : "regular"}
            className={i <= value ? "text-[var(--gold)]" : "text-[var(--text-muted)]"}
          />
        </button>
      ))}
    </div>
  );
}
