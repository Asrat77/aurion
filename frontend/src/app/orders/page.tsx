"use client";

import { useState } from "react";
import Link from "next/link";
import { Receipt, CaretDown, Truck } from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useOrders, useCancelOrder } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ProductImage from "@/components/ui/ProductImage";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { Order } from "@/types";

export default function OrdersPage() {
  const { data: user, isLoading: userLoading } = useMe();
  const { data: orders, isLoading } = useOrders();
  const openAuth = useUiStore((s) => s.openAuth);

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <PageHeader title="My Orders" />

        {userLoading || isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : !user ? (
          <EmptyState
            icon={<Receipt size={32} />}
            title="Sign in to view your orders"
            action={
              <button className="btn btn-primary" onClick={() => openAuth("login")}>
                Sign In
              </button>
            }
          />
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            icon={<Receipt size={32} />}
            title="No orders yet"
            body="Start shopping to see your order history here."
            action={
              <Link href="/store" className="btn btn-primary">
                Browse the Store
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const cancelOrder = useCancelOrder();
  const showToast = useUiStore((s) => s.showToast);
  const money = (cents: number) => formatMoney(cents, order.currency, order.fxRate);

  async function handleCancel() {
    try {
      await cancelOrder.mutateAsync(order.id);
      showToast("Order cancelled. Any reserved stock has been released.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not cancel this order.", "error");
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[var(--gold)]">#{order.reference}</span>
          <StatusBadge status={order.status} />
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>

      {order.status !== "pending" && (
        <div className="mb-5">
          <OrderTimeline order={order} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {order.items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 flex-wrap">
            <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
              <ProductImage
                name={i.productName}
                emoji={i.emoji ?? "\u{1F4E6}"}
                width={64}
                height={64}
                sizes="32px"
                frame={false}
              />
            </div>
            <span className="text-sm text-[var(--text-secondary)] flex-1 min-w-[8rem]">
              {i.productSlug ? (
                <Link href={`/product/${i.productSlug}`} className="hover:text-[var(--gold)]">
                  {i.productName}
                </Link>
              ) : (
                i.productName
              )}{" "}
              &times;{i.quantity}
            </span>
            {order.status !== "pending" && <StatusBadge status={i.fulfillmentStatus} />}
            {i.trackingNumber && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
                <Truck size={14} className="text-[var(--gold)]" />
                {i.carrier ? `${i.carrier} ` : ""}
                {i.trackingNumber}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--border-subtle)] gap-3 flex-wrap">
        <button
          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--gold)]"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <CaretDown
            size={14}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
          {order.items.length} item{order.items.length === 1 ? "" : "s"} &middot;{" "}
          {open ? "Hide" : "Show"} breakdown
        </button>
        <span className="font-mono font-semibold text-[var(--gold)]">
          {money(order.totalCents)}
        </span>
      </div>

      {open && (
        <div className="mt-3 rounded-xl bg-[var(--bg-deep)] p-4">
          <SummaryRow label="Subtotal" value={money(order.subtotalCents)} />
          <SummaryRow
            label="Shipping"
            value={order.shippingCents === 0 ? "Free" : money(order.shippingCents)}
          />
          {order.taxCents > 0 && <SummaryRow label="VAT" value={money(order.taxCents)} />}
          <div className="flex justify-between pt-2 mt-2 border-t border-[var(--border-subtle)] text-sm font-semibold text-white">
            <span>Total</span>
            <span>{money(order.totalCents)}</span>
          </div>

          {order.events.length > 0 && (
            <ol className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-col gap-2">
              {order.events.map((e) => (
                <li key={e.id} className="flex justify-between gap-4 text-xs">
                  <span className="text-[var(--text-secondary)]">
                    {e.label}
                    {e.note && <span className="text-[var(--text-muted)]"> — {e.note}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[var(--text-muted)]">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {order.cancellable && (
        <div className="mt-4 flex justify-end">
          <button
            className="btn btn-outline text-xs"
            onClick={handleCancel}
            disabled={cancelOrder.isPending}
          >
            {cancelOrder.isPending ? "Cancelling…" : "Cancel order"}
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--gold)]">{value}</span>
    </div>
  );
}
