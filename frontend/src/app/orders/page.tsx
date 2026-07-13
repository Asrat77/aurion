"use client";

import { Receipt } from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useOrders } from "@/lib/orders";
import { useUiStore } from "@/store/ui";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ProductImage from "@/components/ui/ProductImage";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

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
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o) => (
              <div key={o.id} className="card">
                <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[var(--gold)]">#{o.reference}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {o.items.map((i) => (
                    <div key={i.id} className="flex items-center gap-3">
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
                      <span className="text-sm text-[var(--text-secondary)]">
                        {i.productName} &times;{i.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)]">{o.items.length} items</span>
                  <span className="font-mono font-semibold text-[var(--gold)]">
                    {formatUsd(o.totalCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
