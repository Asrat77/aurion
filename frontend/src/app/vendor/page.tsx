"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  TrendUp,
  Stack,
  Warning,
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
  useAdvanceVendorOrderLine,
  useVendorAnalytics,
  type VendorProductInput,
  type VendorOrderLine,
} from "@/lib/vendor";
import { ApiError } from "@/lib/api";
import { formatBase } from "@/lib/money";
import type { Product, FulfillmentStatus } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import ProductImage from "@/components/ui/ProductImage";
import { TableSkeleton, StatRowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import RevenueChart from "@/components/vendor/RevenueChart";

const VIEWS: { key: string; labelKey: string; icon: Icon }[] = [
  { key: "overview", labelKey: "vendor.nav.overview", icon: SquaresFour },
  { key: "products", labelKey: "vendor.nav.products", icon: Package },
  { key: "inventory", labelKey: "vendor.nav.inventory", icon: Stack },
  { key: "orders", labelKey: "vendor.nav.orders", icon: Receipt },
  { key: "payouts", labelKey: "vendor.nav.payouts", icon: Wallet },
  { key: "analytics", labelKey: "vendor.nav.analytics", icon: TrendUp },
  { key: "commission", labelKey: "vendor.nav.commission", icon: Percent },
];

export default function VendorPage() {
  const { t } = useTranslation();
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
            title={t("vendor.restrictedTitle")}
            body={t("vendor.restrictedBody")}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-wide)] mx-auto">
        <PageHeader title={t("vendor.title")} />

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
                  {t(v.labelKey)}
                </button>
              ))}
            </nav>
          </aside>

          <div className="card p-8">
            {view === "overview" && <OverviewView />}
            {view === "products" && <ProductsView />}
            {view === "inventory" && <InventoryView />}
            {view === "orders" && <OrdersView />}
            {view === "payouts" && <PayoutsView />}
            {view === "analytics" && <AnalyticsView />}
            {view === "commission" && <CommissionView />}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewView() {
  const { t } = useTranslation();
  const { data, isLoading } = useVendorOverview();
  if (isLoading || !data) return <StatRowSkeleton />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("vendor.overview")}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t("vendor.products")} value={String(data.productCount)} />
        <StatCard label={t("vendor.itemsSold")} value={String(data.itemsSold)} />
        <StatCard label={t("vendor.revenue")} value={formatBase(data.grossCents)} />
        <StatCard label={t("vendor.net", { rate: Math.round((1 - data.commissionRate) * 100) })} value={formatBase(data.netCents)} />
      </div>
      <div>
        <h4 className="text-white mb-2 text-sm font-semibold">{t("vendor.yourProducts")}</h4>
        {data.products.length === 0 ? (
          <EmptyState icon={<Package size={24} />} title={t("vendor.noProducts")} />
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
                <span className="font-mono text-[var(--gold)]">{formatBase(p.priceCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsView() {
  const { t } = useTranslation();
  const { data: overview, isLoading } = useVendorOverview();
  const { data: categories } = useCategories();
  const createProduct = useCreateVendorProduct();
  const updateProduct = useUpdateVendorProduct();
  const deleteProduct = useDeleteVendorProduct();
  const showToast = useUiStore((s) => s.showToast);

  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id: number) {
    if (!window.confirm(t("vendor.deleteConfirm"))) return;
    try {
      await deleteProduct.mutateAsync(id);
      showToast(t("vendor.productDeleted"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("vendor.deleteFailed"), "error");
    }
  }

  if (isLoading || !overview) return <TableSkeleton cols={4} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 className="display-heading">{t("vendor.manageProducts")}</h3>
        <button
          className="btn btn-primary flex items-center gap-1.5"
          style={{ padding: "8px 18px", fontSize: "0.75rem" }}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={14} weight="bold" /> {t("vendor.addProduct")}
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
                showToast(t("vendor.productUpdated"), "success");
              } else {
                await createProduct.mutateAsync(values);
                showToast(t("vendor.productCreated"), "success");
              }
              setShowForm(false);
            } catch (err) {
              showToast(err instanceof ApiError ? err.message : t("vendor.saveFailed"), "error");
            }
          }}
        />
      )}

      {overview.products.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title={t("vendor.noProducts")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("vendor.product")}</th>
              <th className="text-right">{t("vendor.price")}</th>
              <th>{t("vendor.stock")}</th>
              <th>{t("vendor.actions")}</th>
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
                <td className="num">{formatBase(p.priceCents)}</td>
                <td>
                  <span className="inline-flex items-center rounded-full border border-current/20 px-3 py-1 text-xs font-semibold text-[var(--success)] bg-[rgba(92,184,141,0.12)]">
                    {t("vendor.inStock", { count: p.stock })}
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
                      <PencilSimple size={14} /> {t("vendor.edit")}
                    </button>
                    <button
                      className="flex items-center gap-1 text-[var(--danger)] text-xs"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash size={14} /> {t("vendor.delete")}
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
  const { t } = useTranslation();
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category.id ?? categories[0]?.id ?? 0);
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? (product.priceCents / 100).toString() : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [emoji, setEmoji] = useState(product?.emoji ?? "");
  const [origin, setOrigin] = useState(product?.origin ?? "");
  const [freeShipping, setFreeShipping] = useState(product?.freeShipping ?? false);

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
          free_shipping: freeShipping,
        });
      }}
    >
      <div>
        <label className="field-label">{t("vendor.productName")}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="field-label">{t("vendor.category")}</label>
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">{t("vendor.priceUsd")}</label>
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
        <label className="field-label">{t("vendor.stock")}</label>
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
        <label className="field-label">{t("vendor.emoji")}</label>
        <input className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="e.g. ☕" />
        <p className="field-help">{t("vendor.emojiHelp")}</p>
      </div>
      <div>
        <label className="field-label">{t("vendor.origin")}</label>
        <input className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label">{t("vendor.descriptionLabel")}</label>
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--gold)]"
            checked={freeShipping}
            onChange={(e) => setFreeShipping(e.target.checked)}
          />
          {t("vendor.freeShipping")}
        </label>
        <p className="field-help">
          {t("vendor.freeShippingHelp")}
        </p>
      </div>
      <div className="sm:col-span-2 flex gap-3 justify-end">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary">
          {product ? t("vendor.saveChanges") : t("vendor.createProduct")}
        </button>
      </div>
    </form>
  );
}

const NEXT_STATUS_KEYS: Record<FulfillmentStatus, string> = {
  awaiting: "vendor.awaitingDispatch",
  processing: "vendor.startPreparing",
  shipped: "vendor.markShipped",
  delivered: "vendor.markDelivered",
  cancelled: "vendor.cancelLine",
};

function OrdersView() {
  const { t } = useTranslation();
  const { data, isLoading } = useVendorOrders();
  if (isLoading) return <TableSkeleton cols={6} />;

  return (
    <div>
      <h3 className="display-heading mb-1">{t("vendor.orders")}</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">{t("vendor.ordersHelp")}</p>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title={t("vendor.noOrders")} />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((line) => (
            <VendorOrderLineRow key={line.id} line={line} />
          ))}
        </div>
      )}
    </div>
  );
}

function VendorOrderLineRow({ line }: { line: VendorOrderLine }) {
  const { t } = useTranslation();
  const advance = useAdvanceVendorOrderLine();
  const showToast = useUiStore((s) => s.showToast);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  const needsTracking = line.nextStatuses.includes("shipped");

  async function move(status: FulfillmentStatus) {
    try {
      await advance.mutateAsync({
        id: line.id,
        fulfillment_status: status,
        ...(status === "shipped"
          ? { carrier: carrier || undefined, tracking_number: tracking || undefined }
          : {}),
      });
      showToast(t("vendor.lineUpdated", { name: line.productName, status: t(`status.${status}`) }), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("vendor.lineUpdateFailed"), "error");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-sm text-[var(--gold)]">{line.orderReference}</span>
          <span className="text-sm text-[var(--text-secondary)] truncate">
            {line.productName} &times;{line.quantity}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={line.fulfillmentStatus} />
          <span className="font-mono text-sm text-[var(--gold)]">
            {formatBase(line.lineTotalCents)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
        <span>{line.buyerEmail}</span>
        <span>{new Date(line.createdAt).toLocaleDateString()}</span>
        <span>{t("vendor.netLabel", { value: formatBase(line.netCents) })}</span>
        {line.trackingNumber && (
          <span className="font-mono">
            {line.carrier ? `${line.carrier} · ` : ""}
            {line.trackingNumber}
          </span>
        )}
      </div>

      {line.nextStatuses.length > 0 && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--border-subtle)] pt-3">
          {needsTracking && (
            <>
              <div>
                <label className="field-label" htmlFor={`carrier-${line.id}`}>
                  {t("vendor.carrier")}
                </label>
                <input
                  id={`carrier-${line.id}`}
                  className="input"
                  style={{ minWidth: "9rem" }}
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="DHL"
                />
              </div>
              <div>
                <label className="field-label" htmlFor={`tracking-${line.id}`}>
                  {t("vendor.trackingNumber")}
                </label>
                <input
                  id={`tracking-${line.id}`}
                  className="input"
                  style={{ minWidth: "10rem" }}
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="ET-000000"
                />
              </div>
            </>
          )}
          {line.nextStatuses.map((status) => (
            <button
              key={status}
              className={`btn ${status === "cancelled" ? "btn-outline" : "btn-primary"}`}
              style={{ padding: "10px 16px", fontSize: "0.72rem" }}
              disabled={advance.isPending}
              onClick={() => move(status)}
            >
              {t(NEXT_STATUS_KEYS[status])}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PayoutsView() {
  const { t } = useTranslation();
  const { data, isLoading } = useVendorPayouts();
  if (isLoading || !data) return <StatRowSkeleton count={3} />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("vendor.payouts")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label={t("vendor.grossSales")} value={formatBase(data.grossCents)} />
        <StatCard label={t("vendor.commission")} value={formatBase(data.commissionCents)} />
        <StatCard label={t("vendor.netEarnings")} value={formatBase(data.netCents)} />
      </div>
      <div>
        <h4 className="text-white mb-2 text-sm font-semibold">{t("vendor.payoutHistory")}</h4>
        {data.payouts.length === 0 ? (
          <EmptyState
            icon={<Wallet size={24} />}
            title={t("vendor.noPayouts")}
            body={t("vendor.payoutBody")}
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
                  <span className="font-mono text-[var(--gold)]">{formatBase(p.amountCents)}</span>
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
  const { t } = useTranslation();
  const { data, isLoading } = useVendorOverview();
  if (isLoading || !data) return <StatRowSkeleton count={2} />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("vendor.commissionStructure")}</h3>
      <div className="card p-6">
        <p className="text-[var(--text-secondary)]">
          {t("vendor.commissionBody", { rate: Math.round(data.commissionRate * 100) })}
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {t("vendor.commissionHelp")}
        </p>
        <hr className="border-[var(--border-subtle)] my-4" />
        <p className="text-[var(--text-secondary)]">
          {t("vendor.payoutSchedule")} <strong className="text-[var(--gold)]">{t("vendor.monthly")}</strong> (Net 30)
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {t("vendor.payoutScheduleHelp")}
        </p>
      </div>
    </div>
  );
}

const WINDOWS = [7, 30, 90];

function AnalyticsView() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const { data, isLoading } = useVendorAnalytics(days);

  if (isLoading && !data) return <StatRowSkeleton count={4} />;
  if (!data) return null;

  const outstanding =
    data.fulfillment.awaiting + data.fulfillment.processing + data.fulfillment.shipped;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h3 className="display-heading">{t("vendor.analytics")}</h3>
        <div className="flex gap-1.5">
          {WINDOWS.map((w) => (
            <button
              key={w}
              className={`min-h-10 cursor-pointer rounded-full border px-4 text-xs font-semibold transition-colors ${
                days === w
                  ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--bg-deep)]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              }`}
              onClick={() => setDays(w)}
              aria-pressed={days === w}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label={t("vendor.revenue")} value={formatBase(data.revenueCents)} />
        <StatCard label={t("vendor.netEarnings")} value={formatBase(data.netCents)} />
        <StatCard label={t("vendor.orders")} value={String(data.orderCount)} />
        <StatCard label={t("admin.avgOrder")} value={formatBase(data.averageOrderCents)} />
      </div>

      <div className="mb-8">
        <h4 className="mb-2 text-sm font-semibold text-white">{t("vendor.revenueByDay")}</h4>
        <RevenueChart data={data.daily} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">{t("vendor.bestSellers")}</h4>
          {data.topProducts.length === 0 ? (
            <EmptyState icon={<TrendUp size={22} />} title={t("vendor.noSalesWindow")} />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {data.topProducts.map((p) => (
                <div key={p.productId} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span aria-hidden>{p.emoji}</span>
                    <span className="truncate text-[var(--text-secondary)]">{p.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-sm">
                    <span className="text-[var(--text-muted)]">{t("vendor.unitsSold", { count: p.units })}</span>
                    <span className="font-mono text-[var(--gold)]">
                      {formatBase(p.revenueCents)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">
            {t("vendor.openFulfilment")}
            {outstanding > 0 && (
              <span className="ml-2 font-normal text-[var(--text-muted)]">
                {t("vendor.itemsStillOwed", { count: outstanding })}
              </span>
            )}
          </h4>
          <div className="divide-y divide-[var(--border-subtle)]">
            {(["awaiting", "processing", "shipped", "delivered"] as FulfillmentStatus[]).map(
              (status) => (
                <div key={status} className="flex items-center justify-between py-2.5">
                  <StatusBadge status={status} />
                  <span className="font-mono text-sm text-[var(--gold)]">
                    {data.fulfillment[status]}
                  </span>
                </div>
              ),
            )}
          </div>

          <h4 className="mb-2 mt-6 text-sm font-semibold text-white">{t("vendor.customerRating")}</h4>
          <p className="text-sm text-[var(--text-secondary)]">
            {data.rating.average != null ? (
              <>
                <span className="font-mono text-lg text-[var(--gold)]">
                  {data.rating.average.toFixed(1)}
                </span>{" "}
                {t("vendor.acrossReviews", { count: data.rating.reviewCount })}
              </>
            ) : (
              t("vendor.noReviews")
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function InventoryView() {
  const { t } = useTranslation();
  const { data: analytics } = useVendorAnalytics(30);
  const { data: overview, isLoading } = useVendorOverview();
  const updateProduct = useUpdateVendorProduct();
  const showToast = useUiStore((s) => s.showToast);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  async function saveStock(product: Product) {
    const raw = drafts[product.id];
    if (raw === undefined) return;

    const stock = Number(raw);
    if (!Number.isFinite(stock) || stock < 0) {
      showToast(t("vendor.stockZero"), "error");
      return;
    }

    try {
      await updateProduct.mutateAsync({ id: product.id, stock });
      setDrafts((d) => {
        const next = { ...d };
        delete next[product.id];
        return next;
      });
      showToast(t("vendor.stockUpdated", { name: product.name, count: stock }), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("vendor.stockUpdateFailed"), "error");
    }
  }

  if (isLoading || !overview) return <TableSkeleton cols={4} />;

  const lowStockIds = new Set((analytics?.lowStock ?? []).map((p) => p.id));

  return (
    <div>
      <h3 className="display-heading mb-1">{t("vendor.inventory")}</h3>
      <p className="mb-5 text-sm text-[var(--text-muted)]">{t("vendor.inventoryHelp")}</p>

      {lowStockIds.size > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--border-gold)] bg-[rgba(214,180,94,0.06)] p-4">
          <Warning size={20} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-white">
              {t("vendor.lowStock", { count: lowStockIds.size })}
            </span>{" "}
            {t("vendor.restock")}
          </p>
        </div>
      )}

      {overview.products.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title={t("vendor.noProducts")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("vendor.product")}</th>
              <th className="text-right">{t("vendor.price")}</th>
              <th>{t("vendor.stock")}</th>
              <th>{t("common.update")}</th>
            </tr>
          </thead>
          <tbody>
            {overview.products.map((p) => {
              const low = lowStockIds.has(p.id);
              const draft = drafts[p.id];
              const dirty = draft !== undefined && Number(draft) !== p.stock;

              return (
                <tr key={p.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{p.emoji}</span>
                      {p.name}
                    </span>
                  </td>
                  <td className="num">{formatBase(p.priceCents)}</td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full border border-current/20 px-3 py-1 text-xs font-semibold ${
                        p.stock === 0
                          ? "bg-[rgba(224,85,85,0.12)] text-[var(--danger)]"
                          : low
                          ? "bg-[rgba(255,193,7,0.12)] text-[var(--warning)]"
                          : "bg-[rgba(92,184,141,0.12)] text-[var(--success)]"
                      }`}
                    >
                      {p.stock === 0 ? t("vendor.outOfStock") : t("vendor.inStock", { count: p.stock })}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <input
                        className="input"
                        style={{ width: "5.5rem" }}
                        type="number"
                        min="0"
                        aria-label={t("vendor.stockAria", { name: p.name })}
                        value={draft ?? String(p.stock)}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                        }
                      />
                      <button
                        className="btn btn-outline"
                        style={{ padding: "9px 14px", fontSize: "0.7rem" }}
                        disabled={!dirty || updateProduct.isPending}
                        onClick={() => saveStock(p)}
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
