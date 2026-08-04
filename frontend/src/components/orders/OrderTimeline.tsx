"use client";

import { CheckCircle, Circle, Truck, Package, XCircle } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { Order, OrderStatus } from "@/types";

// The happy path a buyer is walked through. Cancelled and refunded orders leave
// this track, so they render as a single terminal step instead.
const TRACK: { status: OrderStatus; labelKey: string; hintKey: string }[] = [
  { status: "paid", labelKey: "orders.timeline.confirmed", hintKey: "orders.timeline.confirmedHint" },
  { status: "processing", labelKey: "orders.timeline.processing", hintKey: "orders.timeline.processingHint" },
  { status: "shipped", labelKey: "orders.timeline.shipped", hintKey: "orders.timeline.shippedHint" },
  { status: "delivered", labelKey: "orders.timeline.delivered", hintKey: "orders.timeline.deliveredHint" },
];

const TRACK_ORDER: OrderStatus[] = TRACK.map((s) => s.status);

export default function OrderTimeline({ order }: { order: Order }) {
  const { t } = useTranslation();
  if (order.status === "cancelled" || order.status === "refunded") {
    const cancelled = order.status === "cancelled";
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-4 py-3">
        <XCircle size={20} weight="fill" className="text-[var(--text-muted)] shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {cancelled ? t("orders.timeline.orderCancelled") : t("orders.timeline.orderRefunded")}
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
                {t(step.labelKey)}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{t(step.hintKey)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
