"use client";

import { CheckCircle, Circle, Truck, Package, XCircle } from "@phosphor-icons/react";
import type { Order, OrderStatus } from "@/types";

// The happy path a buyer is walked through. Cancelled and refunded orders leave
// this track, so they render as a single terminal step instead.
const TRACK: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "paid", label: "Confirmed", hint: "Payment received" },
  { status: "processing", label: "Processing", hint: "Vendor preparing your items" },
  { status: "shipped", label: "Shipped", hint: "On its way to you" },
  { status: "delivered", label: "Delivered", hint: "Order complete" },
];

const TRACK_ORDER: OrderStatus[] = TRACK.map((s) => s.status);

export default function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled" || order.status === "refunded") {
    const cancelled = order.status === "cancelled";
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-4 py-3">
        <XCircle size={20} weight="fill" className="text-[var(--text-muted)] shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {cancelled ? "Order cancelled" : "Order refunded"}
          </p>
          {(order.cancelledAt ?? order.createdAt) && (
            <p className="text-xs text-[var(--text-muted)]">
              {new Date(order.cancelledAt ?? order.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = TRACK_ORDER.indexOf(order.status);

  return (
    <ol className="flex flex-col sm:flex-row gap-3 sm:gap-0">
      {TRACK.map((step, i) => {
        const done = currentIndex >= i;
        const active = currentIndex === i;

        return (
          <li key={step.status} className="flex sm:flex-col sm:flex-1 items-center sm:items-start gap-3 sm:gap-0">
            <div className="flex items-center sm:w-full shrink-0">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  done
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--bg-deep)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                }`}
                aria-hidden
              >
                {step.status === "shipped" ? (
                  <Truck size={14} weight={done ? "fill" : "regular"} />
                ) : step.status === "delivered" ? (
                  <Package size={14} weight={done ? "fill" : "regular"} />
                ) : done ? (
                  <CheckCircle size={14} weight="fill" />
                ) : (
                  <Circle size={12} />
                )}
              </span>
              {i < TRACK.length - 1 && (
                <span
                  className={`hidden sm:block h-px flex-1 ${
                    currentIndex > i ? "bg-[var(--gold)]" : "bg-[var(--border-subtle)]"
                  }`}
                />
              )}
            </div>
            <div className="sm:mt-2 sm:pr-4">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.1em] ${
                  active
                    ? "text-[var(--gold)]"
                    : done
                    ? "text-[var(--text-secondary)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{step.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
