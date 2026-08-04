"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Icon } from "@phosphor-icons/react";
import {
  SquaresFour,
  Package,
  Receipt,
  Users,
  TrendUp,
  Storefront,
  FileText,
  XCircle,
  ShieldCheck,
  Star,
} from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import {
  useAdminOverview,
  useAdminOrders,
  useAdminCustomers,
  useAdminVendors,
  useAdminProducts,
  useAdminAnalytics,
  useAdminRequestForQuotes,
  useAdminCancelOrder,
  useAdminRefundRequests,
  useResolveRefundRequest,
  useAdminReviews,
  useModerateReview,
  useAdminVendorApplications,
  useResolveVendorApplication,
  useUpdateRequestForQuote,
  useQuoteRequestForQuote,
} from "@/lib/admin";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import ProductImage from "@/components/ui/ProductImage";
import { TableSkeleton, StatRowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { formatBase } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { useUiStore } from "@/store/ui";
import type {
  Order,
  RefundRequest,
  Review,
  VendorApplication,
  RequestForQuote,
  RequestForQuoteStatus,
} from "@/types";

const VIEWS: { key: string; labelKey: string; icon: Icon }[] = [
  { key: "overview", labelKey: "admin.nav.overview", icon: SquaresFour },
  { key: "products", labelKey: "admin.nav.products", icon: Package },
  { key: "orders", labelKey: "admin.nav.orders", icon: Receipt },
  { key: "rfqs", labelKey: "admin.nav.sourcing", icon: FileText },
  { key: "refunds", labelKey: "admin.nav.refunds", icon: ShieldCheck },
  { key: "reviews", labelKey: "admin.nav.reviews", icon: Star },
  { key: "customers", labelKey: "admin.nav.customers", icon: Users },
  { key: "analytics", labelKey: "admin.nav.analytics", icon: TrendUp },
  { key: "applications", labelKey: "admin.nav.applications", icon: Storefront },
  { key: "vendors", labelKey: "admin.nav.vendors", icon: Storefront },
];

const REFUND_REASON_KEYS: Record<RefundRequest["reason"], string> = {
  not_received: "refund.reasons.notReceived",
  damaged: "refund.reasons.damaged",
  not_as_described: "refund.reasons.notAsDescribed",
  wrong_item: "refund.reasons.wrongItem",
  other: "refund.reasons.other",
};

export default function AdminPage() {
  const { t } = useTranslation();
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
            title={t("admin.restrictedTitle")}
            body={t("admin.restrictedBody")}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-wide)] mx-auto">
        <PageHeader
          title={t("admin.title")}
          description={t("admin.description")}
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
                  {t(v.labelKey)}
                </button>
              ))}
            </nav>
          </aside>

          <div className="card p-5 sm:p-8 min-w-0">
            {view === "overview" && <OverviewView />}
            {view === "products" && <ProductsView />}
            {view === "orders" && <OrdersView />}
            {view === "rfqs" && <RequestForQuotesView />}
            {view === "refunds" && <RefundRequestsView />}
            {view === "reviews" && <ReviewsView />}
            {view === "customers" && <CustomersView />}
            {view === "analytics" && <AnalyticsView />}
            {view === "applications" && <VendorApplicationsView />}
            {view === "vendors" && <VendorsView />}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewView() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminOverview();
  if (isLoading || !data) return <StatRowSkeleton />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="display-heading">{t("admin.overview")}</h3>
        <span className="text-xs text-[var(--text-muted)]">{t("admin.last30")}</span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label={t("admin.products")} value={String(data.totalProducts)} />
        <StatCard label={t("admin.orders")} value={String(data.totalOrders)} />
        <StatCard label={t("admin.revenue")} value={formatBase(data.totalRevenueCents)} />
        <StatCard label={t("admin.customers")} value={String(data.totalCustomers)} />
        <StatCard label={t("admin.sourcingRequests")} value={String(data.totalRfqs)} />
      </div>
      <div>
        <h4 className="text-white mb-2 text-sm font-semibold">{t("admin.recentOrders")}</h4>
        {data.recentOrders.length === 0 ? (
          <EmptyState icon={<Receipt size={24} />} title={t("admin.noOrders")} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("admin.order")}</th>
                <th>{t("admin.customer")}</th>
                <th className="text-right">{t("admin.total")}</th>
                <th>{t("admin.status")}</th>
                <th>{t("admin.date")}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-[var(--gold)]">{o.reference}</td>
                  <td>{o.buyerEmail}</td>
                  <td className="num">{formatBase(o.totalCents)}</td>
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
  const { t } = useTranslation();
  const { data, isLoading } = useAdminRequestForQuotes();
  if (isLoading) return <TableSkeleton cols={7} />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-2">{t("admin.commercialPipeline")}</p>
          <h3 className="display-heading">{t("admin.sourcingTitle")}</h3>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {t("admin.totalRequests", { count: data?.length ?? 0 })}
        </span>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title={t("admin.noSourcing")}
          body={t("admin.noSourcingBody")}
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
                    <dt className="text-xs text-[var(--text-muted)]">{t("admin.product")}</dt>
                    <dd className="text-[var(--text-primary)]">{request.productInterest}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs text-[var(--text-muted)]">{t("admin.country")}</dt>
                      <dd>{request.country || t("common.notProvided")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--text-muted)]">{t("admin.quantity")}</dt>
                      <dd>{request.estimatedQuantity || t("common.notProvided")}</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">{t("admin.contact")}</dt>
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
                  <th>{t("admin.rfq")}</th>
                  <th>{t("admin.company")}</th>
                  <th>{t("admin.product")}</th>
                  <th>{t("admin.country")}</th>
                  <th>{t("admin.quantity")}</th>
                  <th>{t("admin.contact")}</th>
                  <th>{t("admin.terms")}</th>
                  <th>{t("admin.status")}</th>
                  <th>{t("admin.received")}</th>
                  <th>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((request) => (
                  <tr key={request.id}>
                    <td className="font-mono text-[var(--gold)]">{request.reference}</td>
                    <td>{request.companyName}</td>
                    <td>{request.productName ?? request.productInterest}</td>
                    <td>{request.country || "—"}</td>
                    <td>{request.estimatedQuantity || "—"}</td>
                    <td>{request.email}</td>
                    <td className="text-xs text-[var(--text-muted)]">
                      {[
                        request.incoterm,
                        request.destinationPort,
                        request.sampleRequested ? t("admin.sample") : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                    <td><StatusBadge status={request.status} /></td>
                    <td className="text-xs text-[var(--text-muted)]">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <RfqActions request={request} />
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
  const { t } = useTranslation();
  const { data, isLoading } = useAdminProducts();
  if (isLoading) return <TableSkeleton cols={5} />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("admin.productManagement")}</h3>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title={t("admin.noProducts")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("admin.name")}</th>
              <th>{t("admin.category")}</th>
              <th className="text-right">{t("admin.price")}</th>
              <th>{t("admin.vendor")}</th>
              <th>{t("admin.status")}</th>
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
                <td className="num">{formatBase(p.priceCents)}</td>
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
  const { t } = useTranslation();
  const { data, isLoading } = useAdminOrders();
  const adminCancel = useAdminCancelOrder();
  const showToast = useUiStore((s) => s.showToast);

  async function cancelOrder(order: Order) {
    const note = window.prompt(t("admin.cancelPrompt", { reference: order.reference }));
    if (note === null) return;

    try {
      await adminCancel.mutateAsync({ id: order.id, note: note || undefined });
      showToast(t("admin.cancelledSuccess", { reference: order.reference }), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("admin.cancelFailed"), "error");
    }
  }

  if (isLoading) return <TableSkeleton cols={7} />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("admin.allOrders")}</h3>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title={t("admin.noOrdersFound")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("admin.order")}</th>
              <th>{t("admin.customer")}</th>
              <th className="text-right">{t("admin.items")}</th>
              <th className="text-right">{t("admin.total")}</th>
              <th>{t("admin.status")}</th>
              <th>{t("admin.date")}</th>
              <th>{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id}>
                <td className="font-mono text-[var(--gold)]">{o.reference}</td>
                <td>{o.buyerEmail}</td>
                <td className="num">{o.items.length}</td>
                <td className="num">{formatBase(o.totalCents)}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="text-xs text-[var(--text-muted)]">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td>
                  {o.cancellable ? (
                    <button
                      className="flex min-h-10 items-center gap-1 text-xs text-[var(--danger)]"
                      onClick={() => cancelOrder(o)}
                      disabled={adminCancel.isPending}
                    >
                      <XCircle size={14} /> {t("admin.cancel")}
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">&mdash;</span>
                  )}
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
  const { t } = useTranslation();
  const { data, isLoading } = useAdminCustomers();
  if (isLoading) return <TableSkeleton cols={3} />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("admin.customers")}</h3>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Users size={24} />} title={t("admin.noCustomers")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("admin.email")}</th>
              <th className="text-right">{t("admin.orders")}</th>
              <th className="text-right">{t("admin.totalSpent")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.email}>
                <td>{c.email}</td>
                <td className="num">{c.orders}</td>
                <td className="num">{formatBase(c.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AnalyticsView() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminAnalytics();
  if (isLoading || !data) return <StatRowSkeleton />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("admin.analytics")}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t("admin.totalRevenue")} value={formatBase(data.totalRevenueCents)} />
        <StatCard label={t("admin.avgOrder")} value={formatBase(data.avgOrderCents)} />
        <StatCard label={t("admin.totalOrders")} value={String(data.totalOrders)} />
        <StatCard label={t("admin.topProduct")} value={data.topProductName ?? t("admin.noneYet")} />
      </div>
      <div className="card p-6">
        <h4 className="text-white mb-2 text-sm font-semibold">{t("admin.revenueTrend")}</h4>
        <p className="text-sm text-[var(--text-muted)]">
          {data.totalOrders > 0
            ? t("admin.ordersPlaced", { count: data.totalOrders, value: formatBase(data.avgOrderCents) })
            : t("admin.noData")}
        </p>
      </div>
    </div>
  );
}

function VendorsView() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminVendors();
  if (isLoading) return <TableSkeleton cols={4} />;

  return (
    <div>
      <h3 className="display-heading mb-4">{t("admin.vendorManagement")}</h3>
      <p className="text-[var(--text-muted)] mb-4 text-sm">
        {t("admin.activeVendors", { count: data?.length ?? 0 })}
      </p>
      {!data || data.length === 0 ? (
        <EmptyState icon={<Storefront size={24} />} title={t("admin.noVendors")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("admin.vendor")}</th>
              <th className="text-right">{t("admin.products")}</th>
              <th className="text-right">{t("admin.revenue")}</th>
              <th>{t("admin.status")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v) => (
              <tr key={v.id}>
                <td>{v.storeName}</td>
                <td className="num">{v.productCount}</td>
                <td className="num">{formatBase(v.revenueCents)}</td>
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

function RefundRequestsView() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminRefundRequests();
  const resolve = useResolveRefundRequest();
  const showToast = useUiStore((s) => s.showToast);

  async function decide(claim: RefundRequest, decision: "approve" | "reject") {
    const note = window.prompt(
      decision === "approve"
        ? t("admin.upholdPrompt", { product: claim.productName })
        : t("admin.declinePrompt"),
    );
    if (note === null) return;

    try {
      await resolve.mutateAsync({ id: claim.id, decision, note: note || undefined });
      showToast(
        decision === "approve" ? t("admin.upheld") : t("admin.declined"),
        "success",
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("admin.resolveFailed"), "error");
    }
  }

  if (isLoading) return <TableSkeleton cols={6} />;

  const open = data?.filter((c) => c.status === "open") ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-2">{t("admin.refundEyebrow")}</p>
          <h3 className="display-heading">{t("admin.refundClaims")}</h3>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {t("admin.awaitingDecision", { count: open.length })}
        </span>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title={t("admin.noRefunds")}
          body={t("admin.noRefundsBody")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((claim) => (
            <article
              key={claim.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--gold)]">
                    {claim.orderReference}
                  </span>
                  <h4 className="mt-1 text-base font-semibold text-white">{claim.productName}</h4>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {claim.buyerEmail} &middot; {t("admin.soldBy")} {claim.vendorName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={claim.status} />
                  <span className="font-mono text-sm text-[var(--gold)]">
                    {formatBase(claim.amountCents)}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--gold-light)]">{t(REFUND_REASON_KEYS[claim.reason])}</span>
                {claim.detail && <> &mdash; {claim.detail}</>}
              </p>

              {claim.resolutionNote && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {t("admin.resolution")}: {claim.resolutionNote}
                </p>
              )}

              {claim.status === "open" && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                  <button
                    className="btn btn-primary"
                    style={{ padding: "10px 16px", fontSize: "0.72rem" }}
                    disabled={resolve.isPending}
                    onClick={() => decide(claim, "approve")}
                  >
                    {t("admin.upholdRefund")}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: "10px 16px", fontSize: "0.72rem" }}
                    disabled={resolve.isPending}
                    onClick={() => decide(claim, "reject")}
                  >
                    {t("admin.decline")}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsView() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminReviews();
  const moderate = useModerateReview();
  const showToast = useUiStore((s) => s.showToast);

  async function toggle(review: Review) {
    const status = review.status === "published" ? "hidden" : "published";
    try {
      await moderate.mutateAsync({ id: review.id, status });
      showToast(status === "hidden" ? t("admin.reviewHidden") : t("admin.reviewRestored"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("admin.reviewUpdateFailed"), "error");
    }
  }

  if (isLoading) return <TableSkeleton cols={5} />;

  return (
    <div>
      <div className="mb-6">
        <p className="section-label mb-2">{t("admin.moderation")}</p>
        <h3 className="display-heading">{t("admin.nav.reviews")}</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{t("admin.reviewDescription")}</p>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState icon={<Star size={24} />} title={t("admin.noReviews")} />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-white">{review.productName}</h4>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {review.authorName} &middot; {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[var(--gold)]">{review.rating}/5</span>
                  <StatusBadge status={review.status} />
                </div>
              </div>

              {review.title && <p className="mt-3 font-semibold text-white">{review.title}</p>}
              {review.body && (
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {review.body}
                </p>
              )}

              <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
                <button
                  className="btn btn-outline"
                  style={{ padding: "10px 16px", fontSize: "0.72rem" }}
                  disabled={moderate.isPending}
                  onClick={() => toggle(review)}
                >
                  {review.status === "published" ? t("admin.hideReview") : t("admin.restoreReview")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function VendorApplicationsView() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminVendorApplications();
  const resolve = useResolveVendorApplication();
  const showToast = useUiStore((s) => s.showToast);

  async function decide(application: VendorApplication, decision: "approve" | "reject") {
    const note = window.prompt(
      decision === "approve"
        ? t("admin.approvePrompt", { store: application.storeName })
        : t("admin.rejectPrompt", { store: application.storeName }),
    );
    if (note === null) return;

    try {
      await resolve.mutateAsync({ id: application.id, decision, note: note || undefined });
      showToast(
        decision === "approve" ? t("admin.approved", { store: application.storeName }) : t("admin.applicationRejected"),
        "success",
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("admin.applicationDecisionFailed"), "error");
    }
  }

  if (isLoading) return <TableSkeleton cols={5} />;

  const pending = data?.filter((a) => a.status === "pending") ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-2">{t("admin.onboarding")}</p>
          <h3 className="display-heading">{t("admin.applicationsTitle")}</h3>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{t("admin.awaitingReview", { count: pending.length })}</span>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          icon={<Storefront size={24} />}
          title={t("admin.noApplications")}
          body={t("admin.noApplicationsBody")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((application) => (
            <article
              key={application.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-white">{application.storeName}</h4>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {application.contactName} &middot; {application.ownerEmail} &middot;{" "}
                    {application.contactPhone}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {[application.city, application.country].filter(Boolean).join(", ")}
                    {application.businessRegistration && ` · Reg ${application.businessRegistration}`}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>

              {application.productFocus && (
                <p className="mt-3 text-sm text-[var(--gold-light)]">{application.productFocus}</p>
              )}
              {application.bio && (
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {application.bio}
                </p>
              )}
              {application.website && (
                <p className="mt-2 text-xs text-[var(--text-muted)] break-all">
                  {application.website}
                </p>
              )}
              {application.reviewNote && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {t("admin.decisionNote")}: {application.reviewNote}
                </p>
              )}

              {application.status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                  <button
                    className="btn btn-primary"
                    style={{ padding: "10px 16px", fontSize: "0.72rem" }}
                    disabled={resolve.isPending}
                    onClick={() => decide(application, "approve")}
                  >
                    {t("admin.approveVendor")}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: "10px 16px", fontSize: "0.72rem" }}
                    disabled={resolve.isPending}
                    onClick={() => decide(application, "reject")}
                  >
                    {t("admin.reject")}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const RFQ_NEXT_STATUS: Partial<Record<RequestForQuoteStatus, RequestForQuoteStatus>> = {
  new: "reviewing",
  quoted: "closed",
};

function RfqActions({ request }: { request: RequestForQuote }) {
  const { t } = useTranslation();
  const updateStatus = useUpdateRequestForQuote();
  const sendQuote = useQuoteRequestForQuote();
  const showToast = useUiStore((s) => s.showToast);

  const next = RFQ_NEXT_STATUS[request.status];

  async function advance() {
    if (!next) return;
    try {
      await updateStatus.mutateAsync({ id: request.id, status: next });
      showToast(t("admin.mark", { status: t(`status.${next}`) }), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("admin.requestUpdateFailed"), "error");
    }
  }

  async function quote() {
    const price = window.prompt(t("admin.quotePricePrompt", { company: request.companyName }));
    if (price === null) return;

    const cents = Math.round(parseFloat(price) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      showToast(t("admin.pricePositive"), "error");
      return;
    }

    const lead = window.prompt(t("admin.leadPrompt"));
    const note = window.prompt(t("admin.quoteNotePrompt"));

    try {
      await sendQuote.mutateAsync({
        id: request.id,
        quoted_unit_price_cents: cents,
        quoted_lead_time_days: lead ? Number(lead) : undefined,
        quote_note: note || undefined,
      });
      showToast(t("admin.quoteRecorded", { reference: request.reference }), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("admin.quoteFailed"), "error");
    }
  }

  const busy = updateStatus.isPending || sendQuote.isPending;

  return (
    <div className="flex flex-wrap gap-3">
      {request.status !== "closed" && request.status !== "quoted" && (
        <button
          className="flex min-h-9 items-center text-xs text-[var(--gold)] hover:underline"
          onClick={quote}
          disabled={busy}
        >
          {t("admin.sendQuote")}
        </button>
      )}
      {next && (
        <button
          className="flex min-h-9 items-center text-xs text-[var(--text-muted)] hover:text-[var(--gold)]"
          onClick={advance}
          disabled={busy}
        >
          {t("admin.mark", { status: t(`status.${next}`) })}
        </button>
      )}
      {request.quotedUnitPriceCents != null && (
        <span className="flex min-h-9 items-center font-mono text-xs text-[var(--success)]">
          {formatBase(request.quotedUnitPriceCents)}/{t("admin.unit")}
        </span>
      )}
    </div>
  );
}
