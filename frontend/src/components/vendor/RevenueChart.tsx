"use client";

import { formatBase } from "@/lib/money";

export interface RevenuePoint {
  date: string;
  revenueCents: number;
  units: number;
}

/**
 * A plain SVG bar chart. Revenue is the only series, so a chart library would
 * be more weight than the job needs.
 */
export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const peak = Math.max(...data.map((d) => d.revenueCents), 1);
  const total = data.reduce((sum, d) => sum + d.revenueCents, 0);

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] text-sm text-[var(--text-muted)]">
        No sales in this window yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
      <div
        className="flex h-40 items-end gap-[2px]"
        role="img"
        aria-label={`Daily revenue over ${data.length} days, peaking at ${formatBase(peak)}`}
      >
        {data.map((point) => {
          const height = (point.revenueCents / peak) * 100;
          const date = new Date(point.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={point.date}
              className="group relative flex-1 rounded-t-[2px] bg-[var(--gold)] transition-opacity hover:opacity-100"
              style={{
                height: `${Math.max(height, point.revenueCents > 0 ? 3 : 0)}%`,
                opacity: point.revenueCents > 0 ? 0.75 : 0.12,
                minHeight: point.revenueCents > 0 ? undefined : "2px",
              }}
            >
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border-gold)] bg-[rgba(5,7,13,0.97)] px-2 py-1 font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--gold-light)] opacity-0 transition-opacity group-hover:opacity-100">
                {date}: {formatBase(point.revenueCents)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--text-muted)]">
        <span>
          {new Date(data[0].date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>Peak {formatBase(peak)}</span>
        <span>
          {new Date(data[data.length - 1].date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
