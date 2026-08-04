"use client";

import { ChatCircleText } from "@phosphor-icons/react";
import { useProductReviews } from "@/lib/reviews";
import { StarRating } from "@/components/reviews/StarRating";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductReviews({ slug }: { slug: string }) {
  const { data, isLoading } = useProductReviews(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="w-48 h-6" />
        <Skeleton className="w-full h-20" />
      </div>
    );
  }

  const summary = data?.summary;
  const reviews = data?.reviews ?? [];

  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="display-heading mb-5">
        Reviews
      </h2>

      {!summary || summary.total === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-5 py-4">
          <ChatCircleText size={22} className="text-[var(--gold)] shrink-0" />
          <p className="text-sm text-[var(--text-secondary)]">
            No reviews yet. Buyers can review a product once their order is delivered.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-5">
            <div className="shrink-0">
              <div className="font-mono text-4xl font-semibold text-[var(--gold-light)]">
                {summary.average?.toFixed(1)}
              </div>
              <StarRating rating={summary.average ?? 0} className="mt-1.5" />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                {summary.total} review{summary.total === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 justify-center min-w-0">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[String(star)] ?? 0;
                const pct = summary.total ? (count / summary.total) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-3 shrink-0 text-[var(--text-muted)]">{star}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                      <span
                        className="block h-full rounded-full bg-[var(--gold)] transition-[width] duration-500 ease-[var(--ease-out)]"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right font-mono text-[var(--text-muted)]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className="mt-6 flex flex-col divide-y divide-[var(--border-subtle)]">
            {reviews.map((review) => (
              <li key={review.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StarRating rating={review.rating} size={14} />
                  {review.title && (
                    <span className="font-semibold text-white">{review.title}</span>
                  )}
                </div>
                {review.body && (
                  <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">{review.body}</p>
                )}
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {review.authorName} &middot; verified purchase &middot;{" "}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
