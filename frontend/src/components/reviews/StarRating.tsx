"use client";

import { Star } from "@phosphor-icons/react";

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
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5`}>
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
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
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
