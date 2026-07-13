"use client";

import { useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  SquaresFour,
  Package,
  Receipt,
  Wallet,
  Percent,
  PencilSimple,
  Trash,
  Storefront,
  Plus,
} from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useUiStore } from "@/store/ui";
import { useCategories } from "@/lib/products";
import {
  useVendorOverview,
  useVendorOrders,
  useVendorPayouts,
  useCreateVendorProduct,
  useUpdateVendorProduct,
  useDeleteVendorProduct,
  type VendorProductInput,
} from "@/lib/vendor";
import { ApiError } from "@/lib/api";
import type { Product } from "@/types";
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
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "commission", label: "Commission", icon: Percent },
];

export default function VendorPage() {
  const { data: user, isLoading } = useMe();
  const [view, setView] = useState("overview");

  if (isLoading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-wide)] mx-auto grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          <div className="card h-64" />
          <div className="card">
            <TableSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (!user || user.role !== "vendor") {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-wide)] mx-auto">
          <EmptyState
            icon={<Storefront size={32} />}
            title="Vendor accounts only"
            body="This area is restricted to vendor accounts."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-wide)] mx-auto">
        <PageHeader title="Your Store" />

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          <aside className="card p-4 h-fit">
            <nav className="flex md:flex-col gap-1 flex-wrap">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
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

          <div className="card p-8">
            {view === "overview" && <OverviewView />}
            {view === "products" && <ProductsView />}
            {view === "orders" && <OrdersView />}
            {view === "payouts" && <PayoutsView />}
            {view === "commission" && <CommissionView />}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewView() {
  const { data, isLoading } = useVendorOverview();
  if (isLoading || !data) return <StatRowSkeleton />;

  return (
    <div>
      <h3 className="display-heading mb-4">Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Products" value={String(data.productCount)} />
        <StatCard label="Items Sold" value={String(data.itemsSold)} />
        <StatCard label="Revenue" value={formatUsd(data.grossCents)} />
        <StatCard label={`Net (${Math.round((1 - data.commissionRate) * 100)}%)`} value={formatUsd(data.netCents)} />
      </div>
      <div>
        <h4 className="text-white mb-2 text-sm font-semibold">Your Products</h4>
        {data.products.length === 0 ? (
          <EmptyState icon={<Package size={24} />} title="No products yet" />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {data.products.map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2.5">
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
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-mono text-[var(--gold)]">{formatUsd(p.priceCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsView() {
  const { data: overview, isLoading } = useVendorOverview();
  const { data: categories } = useCategories();
  const createProduct = useCreateVendorProduct();
  const updateProduct = useUpdateVendorProduct();
  const deleteProduct = useDeleteVendorProduct();
  const showToast = useUiStore((s) => s.showToast);

  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      showToast("Product deleted.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not delete product.", "error");
    }
  }

  if (isLoading || !overview) return <TableSkeleton cols={4} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 className="display-heading">Manage Products</h3>
        <button
          className="btn btn-primary flex items-center gap-1.5"
          style={{ padding: "8px 18px", fontSize: "0.75rem" }}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={14} weight="bold" /> Add Product
        </button>
      </div>

      {showForm && (
        <ProductForm
          categories={categories ?? []}
          product={editing}
          onCancel={() => setShowForm(false)}
          onSubmit={async (values) => {
            try {
              if (editing) {
                await updateProduct.mutateAsync({ id: editing.id, ...values });
                showToast("Product updated.", "success");
              } else {
                await createProduct.mutateAsync(values);
                showToast("Product created.", "success");
              }
              setShowForm(false);
            } catch (err) {
              showToast(err instanceof ApiError ? err.message : "Save failed.", "error");
            }
          }}
        />
      )}

      {overview.products.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title="No products yet" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th className="text-right">Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {overview.products.map((p) => (
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
                <td className="num">{formatUsd(p.priceCents)}</td>
                <td>
                  <span className="inline-flex items-center rounded-full border border-current/20 px-3 py-1 text-xs font-semibold text-[var(--success)] bg-[rgba(92,184,141,0.12)]">
                    {p.stock} in stock
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <button
                      className="flex items-center gap-1 text-[var(--gold)] text-xs"
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                      }}
                    >
                      <PencilSimple size={14} /> Edit
                    </button>
                    <button
                      className="flex items-center gap-1 text-[var(--danger)] text-xs"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProductForm({
  categories,
  product,
  onSubmit,
  onCancel,
}: {
  categories: { id: number; name: string }[];
  product: Product | null;
  onSubmit: (values: VendorProductInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category.id ?? categories[0]?.id ?? 0);
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? (product.priceCents / 100).toString() : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [emoji, setEmoji] = useState(product?.emoji ?? "");
  const [origin, setOrigin] = useState(product?.origin ?? "");

  return (
    <form
      className="card grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          category_id: Number(categoryId),
          description,
          price_cents: Math.round(parseFloat(price || "0") * 100),
          stock: Number(stock || 0),
          emoji,
          origin,
        });
      }}
    >
      <div>
        <label className="field-label">Product name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="field-label">Category</label>
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Price (USD)</label>
        <input
          className="input"
          type="number"
          step="0.01"
          min="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="field-label">Stock</label>
        <input
          className="input"
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="field-label">Emoji</label>
        <input className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="e.g. ☕" />
        <p className="field-help">Used as a fallback icon when no photo is available.</p>
      </div>
      <div>
        <label className="field-label">Origin</label>
        <input className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">Description</label>
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2 flex gap-3 justify-end">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {product ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

function OrdersView() {
  const { data, isLoading } = useVendorOrders();
  if (isLoading) return <TableSkeleton cols={5} />;

  return (
    <div>
      <h3 className="display-heading mb-4">Orders</h3>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title="No orders for your products yet" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Product</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Total</th>
              <th>Customer</th>
            </tr>
          </thead>
          <tbody>
            {data.map((i) => (
              <tr key={i.id}>
                <td className="font-mono text-[var(--gold)]">{i.orderReference}</td>
                <td>{i.productName}</td>
                <td className="num">{i.quantity}</td>
                <td className="num">{formatUsd(i.lineTotalCents)}</td>
                <td>{i.buyerEmail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PayoutsView() {
  const { data, isLoading } = useVendorPayouts();
  if (isLoading || !data) return <StatRowSkeleton count={3} />;

  return (
    <div>
      <h3 className="display-heading mb-4">Payouts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Gross Sales" value={formatUsd(data.grossCents)} />
        <StatCard label="Commission" value={formatUsd(data.commissionCents)} />
        <StatCard label="Net Earnings" value={formatUsd(data.netCents)} />
      </div>
      <div>
        <h4 className="text-white mb-2 text-sm font-semibold">Payout History</h4>
        {data.payouts.length === 0 ? (
          <EmptyState
            icon={<Wallet size={24} />}
            title="No payouts yet"
            body="Your earnings will be paid out monthly."
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {data.payouts.map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[var(--gold)]">{p.orderReference}</span>
                  <span className="text-[var(--text-secondary)]">{p.productName}</span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  <span className="font-mono text-[var(--gold)]">{formatUsd(p.amountCents)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommissionView() {
  const { data, isLoading } = useVendorOverview();
  if (isLoading || !data) return <StatRowSkeleton count={2} />;

  return (
    <div>
      <h3 className="display-heading mb-4">Commission Structure</h3>
      <div className="card p-6">
        <p className="text-[var(--text-secondary)]">
          AURION charges a{" "}
          <strong className="text-[var(--gold)]">{Math.round(data.commissionRate * 100)}%</strong>{" "}
          commission on all sales made through the marketplace.
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          This covers payment processing, marketing, platform maintenance, and customer support.
        </p>
        <hr className="border-[var(--border-subtle)] my-4" />
        <p className="text-[var(--text-secondary)]">
          Your payout schedule: <strong className="text-[var(--gold)]">Monthly</strong> (Net 30)
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Payouts are processed on the 15th of each month for the previous month&apos;s earnings.
        </p>
      </div>
    </div>
  );
}
