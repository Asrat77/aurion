"use client";

import { Package, Clock, Stack, FlaskIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useWholesaleCatalogue } from "@/lib/requestForQuotes";
import { formatBase } from "@/lib/money";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { Product } from "@/types";

/**
 * The commercial catalogue: what AURION can actually quote, with the MOQ,
 * volume breaks and lead time a buyer needs before they ask for a price.
 */
export default function WholesaleCatalogue({
  onRequestQuote,
}: {
  onRequestQuote: (product: Product) => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useWholesaleCatalogue();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Stack size={28} />}
        title={t("wholesale.emptyTitle")}
        body={t("wholesale.emptyBody")}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((product) => (
        <WholesaleCard key={product.id} product={product} onRequestQuote={onRequestQuote} />
      ))}
    </div>
  );
}

function WholesaleCard({
  product,
  onRequestQuote,
}: {
  product: Product;
  onRequestQuote: (product: Product) => void;
}) {
  const { t } = useTranslation();
  const terms = product.wholesale;
  if (!terms) return null;

  const uom = terms.unitOfMeasure ?? "unit";
  const best = terms.priceTiers[terms.priceTiers.length - 1];

  return (
    <article className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-label mb-1.5">{product.category.name}</p>
          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {product.origin} &middot; {product.vendor.storeName}
          </p>
        </div>
        <span aria-hidden className="text-2xl">
          {product.emoji}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Term icon={<Package size={15} />} label={t("wholesale.moq")} value={`${terms.moq.toLocaleString()} ${uom}`} />
        {terms.leadTimeDays != null && (
          <Term icon={<Clock size={15} />} label={t("wholesale.leadTime")} value={t("wholesale.days", { count: terms.leadTimeDays })} />
        )}
        {terms.packaging && (
          <div className="col-span-2">
            <Term icon={<Stack size={15} />} label={t("wholesale.packaging")} value={terms.packaging} />
          </div>
        )}
        {terms.sampleAvailable && (
          <div className="col-span-2">
            <Term
              icon={<FlaskIcon size={15} />}
              label={t("wholesale.samples")}
              value={
                terms.samplePriceCents
                  ? `${t("wholesale.available")} — ${formatBase(terms.samplePriceCents)}`
                  : t("wholesale.availableOnRequest")
              }
            />
          </div>
        )}
      </dl>

      {terms.priceTiers.length > 0 && (
        <table className="mt-5 w-full text-sm">
          <caption className="mb-2 text-left text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
            {t("wholesale.volumePricing")}
          </caption>
          <thead>
            <tr className="text-xs text-[var(--text-muted)]">
              <th className="pb-1 text-left font-normal">{t("wholesale.quantity")}</th>
              {/* "Unit price" rather than "per {uom}" — a unit of measure like
                  "pieces" is already plural and reads wrong after "per". */}
              <th className="pb-1 text-right font-normal">{t("wholesale.unitPrice")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {terms.priceTiers.map((tier) => (
              <tr key={tier.minQuantity}>
                <td className="py-1.5 text-[var(--text-secondary)]">
                  {tier.minQuantity.toLocaleString()}+ {uom}
                </td>
                <td className="py-1.5 text-right font-mono text-[var(--gold)]">
                  {formatBase(tier.unitPriceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {best && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {t("wholesale.bestRate", { price: formatBase(best.unitPriceCents), quantity: best.minQuantity.toLocaleString(), unit: uom })}
        </p>
      )}

      <button
        className="btn btn-outline mt-5 w-full"
        onClick={() => onRequestQuote(product)}
      >
        {t("wholesale.requestQuote")}
      </button>
    </article>
  );
}

function Term({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-[var(--gold)]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</dt>
        <dd className="text-[var(--text-secondary)]">{value}</dd>
      </div>
    </div>
  );
}
