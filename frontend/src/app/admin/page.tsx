"use client";

import { useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { SquaresFour, Package, Receipt, Users, TrendUp, Storefront, FileText } from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import {
  useAdminOverview,
  useAdminOrders,
  useAdminCustomers,
  useAdminVendors,
  useAdminProducts,
  useAdminAnalytics,
  useAdminRequestForQuotes,
} from "@/lib/admin";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import ProductImage from "@/components/ui/ProductImage";
import { TableSkeleton, StatRowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const VIEWS: { key: string; label: string; icon: Icon }[] = [
  { key: "overview", label: "Overview", icon: SquaresFour },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: Receipt },
  { key: "rfqs", label: "Sourcing", icon: FileText },
  { key: "customers", label: "Customers", icon: Users },
  { key: "analytics", label: "Analytics", icon: TrendUp },
  { key: "vendors", label: "Vendors", icon: Storefront },
];

export default function AdminPage() {
  const { data: user, isLoading } = useMe();
  const [view, setView] = useState("overview");

  if (isLoading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-wide)] mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          <div className="card h-64" />
          <div className="card">
            <TableSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-wide)] mx-auto">
          <EmptyState
            icon={<Storefront size={32} />}
            title="Admin accounts only"
            body="This area is restricted to administrator accounts."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-wide)] mx-auto">
        <PageHeader
          title="Command Center"
          description="Retail operations and commercial sourcing in one place."
        />

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          <aside className="card p-4 h-fit md:sticky md:top-28">
            <nav className="flex md:flex-col gap-1 flex-wrap">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    view === v.key
                      ? "bg-[rgba(200,164,92,0.08)] text-[var(--gold)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--gold)]"
                  }`}
                  onClick={() => setView(v.key)}
                >
                  <v.icon size={20} />
                  {v.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="card p-5 sm:p-8 min-w-0">
            {view === "overview" && <OverviewView />}
            {view === "products" && <ProductsView />}
            {view === "orders" && <OrdersView />}
            {view === "rfqs" && <RequestForQuotesView />}
            {view === "customers" && <CustomersView />}
            {view === "analytics" && <AnalyticsView />}
            {view === "vendors" && <VendorsView />}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewView() {
  const { data, isLoading } = useAdminOverview();
  if (isLoading || !data) return <StatRowSkeleton />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="display-heading">Overview</h3>
        <span className="text-xs text-[var(--text-muted)]">Last 30 days</span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Products" value={String(data.totalProducts)} />
        <StatCard label="Orders" value={String(data.totalOrders)} />
        <StatCard label="Revenue" value={formatUsd(data.totalRevenueCents)} />
        <StatCard label="Customers" value={String(data.totalCustomers)} />
        <StatCard label="Sourcing requests" value={String(data.totalRfqs)} />
      </div>
      <div>
        <h4 className="text-white mb-2 text-sm font-semibold">Recent Orders</h4>
        {data.recentOrders.length === 0 ? (
          <EmptyState icon={<Receipt size={24} />} title="No orders yet" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-[var(--gold)]">{o.reference}</td>
                  <td>{o.buyerEmail}</td>
                  <td className="num">{formatUsd(o.totalCents)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-xs text-[var(--text-muted)]">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RequestForQuotesView() {
  const { data, isLoading } = useAdminRequestForQuotes();
  if (isLoading) return <TableSkeleton cols={7} />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-2">Commercial pipeline</p>
          <h3 className="display-heading">Sourcing Requests</h3>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {data?.length ?? 0} total requests
        </span>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No sourcing requests yet"
          body="New commercial inquiries will appear here with their RFQ reference."
        />
      ) : (
        <>
          <div className="grid gap-3 xl:hidden">
            {data.map((request) => (
              <article key={request.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--gold)]">
                      {request.reference}
                    </span>
                    <h4 className="mt-1 text-base font-semibold text-white">{request.companyName}</h4>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Product</dt>
                    <dd className="text-[var(--text-primary)]">{request.productInterest}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs text-[var(--text-muted)]">Country</dt>
                      <dd>{request.country || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--text-muted)]">Quantity</dt>
                      <dd>{request.estimatedQuantity || "Not provided"}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Contact</dt>
                    <dd className="break-all">{request.email}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>RFQ</th>
                  <th>Company</th>
                  <th>Product</th>
                  <th>Country</th>
                  <th>Quantity</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {data.map((request) => (
                  <tr key={request.id}>
                    <td className="font-mono text-[var(--gold)]">{request.reference}</td>
                    <td>{request.companyName}</td>
                    <td>{request.productInterest}</td>
                    <td>{request.country || "—"}</td>
                    <td>{request.estimatedQuantity || "—"}</td>
                    <td>{request.email}</td>
                    <td><StatusBadge status={request.status} /></td>
                    <td className="text-xs text-[var(--text-muted)]">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ProductsView() {
  const { data, isLoading } = useAdminProducts();
  if (isLoading) return <TableSkeleton cols={5} />;

  return (
    <div>
      <h3 className="display-heading mb-4">Product Management</h3>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title="No products yet" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th className="text-right">Price</th>
              <th>Vendor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                      <ProductImage
                        name={p.name}
                        emoji={p.emoji}
                        width={64}
                        height={64}
                        sizes="32px"
                        frame={false}
                      />
                    </div>
                    {p.name}
                  </div>
                </td>
                <td className="capitalize">{p.category.name}</td>
                <td className="num">{formatUsd(p.priceCents)}</td>
                <td>{p.vendor.storeName}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function OrdersView() {
  const { data, isLoading } = useAdminOrders();
  if (isLoading) return <TableSkeleton cols={6} />;

  return (
    <div>
      <h3 className="display-heading mb-4">All Orders</h3>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title="No orders found" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th className="text-right">Items</th>
              <th className="text-right">Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id}>
                <td className="font-mono text-[var(--gold)]">{o.reference}</td>
                <td>{o.buyerEmail}</td>
                <td className="num">{o.items.length}</td>
                <td className="num">{formatUsd(o.totalCents)}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="text-xs text-[var(--text-muted)]">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CustomersView() {
  const { data, isLoading } = useAdminCustomers();
  if (isLoading) return <TableSkeleton cols={3} />;

  return (
    <div>
      <h3 className="display-heading mb-4">Customers</h3>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Users size={24} />} title="No customers yet" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th className="text-right">Orders</th>
              <th className="text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.email}>
                <td>{c.email}</td>
                <td className="num">{c.orders}</td>
                <td className="num">{formatUsd(c.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AnalyticsView() {
  const { data, isLoading } = useAdminAnalytics();
  if (isLoading || !data) return <StatRowSkeleton />;

  return (
    <div>
      <h3 className="display-heading mb-4">Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatUsd(data.totalRevenueCents)} />
        <StatCard label="Avg Order" value={formatUsd(data.avgOrderCents)} />
        <StatCard label="Total Orders" value={String(data.totalOrders)} />
        <StatCard label="Top Product" value={data.topProductName ?? "None yet"} />
      </div>
      <div className="card p-6">
        <h4 className="text-white mb-2 text-sm font-semibold">Revenue Trend</h4>
        <p className="text-sm text-[var(--text-muted)]">
          {data.totalOrders > 0
            ? `${data.totalOrders} orders placed. Average order value: ${formatUsd(data.avgOrderCents)}`
            : "No data yet. Start selling to see trends."}
        </p>
      </div>
    </div>
  );
}

function VendorsView() {
  const { data, isLoading } = useAdminVendors();
  if (isLoading) return <TableSkeleton cols={4} />;

  return (
    <div>
      <h3 className="display-heading mb-4">Vendor Management</h3>
      <p className="text-[var(--text-muted)] mb-4 text-sm">
        {data?.length ?? 0} active vendors on the platform.
      </p>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Storefront size={24} />} title="No vendors yet" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th className="text-right">Products</th>
              <th className="text-right">Revenue</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v) => (
              <tr key={v.id}>
                <td>{v.storeName}</td>
                <td className="num">{v.productCount}</td>
                <td className="num">{formatUsd(v.revenueCents)}</td>
                <td>
                  <StatusBadge status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
