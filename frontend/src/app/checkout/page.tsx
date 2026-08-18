"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Package,
  CreditCard,
} from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useUiStore } from "@/store/ui";
import { useCartStore } from "@/store/cart";
import {
  useCreateOrder,
  useMockConfirmPayment,
  useOrderQuote,
  type ShippingAddress,
} from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { OrderQuote } from "@/types";

const COUNTRIES = [
  { value: "ET", label: "Ethiopia" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "AE", label: "UAE" },
  { value: "KE", label: "Kenya" },
  { value: "NG", label: "Nigeria" },
  { value: "ZA", label: "South Africa" },
];

const STEP_KEYS = [
  { n: 1, key: "checkout.steps.shipping" },
  { n: 2, key: "checkout.steps.payment" },
  { n: 3, key: "checkout.steps.confirm" },
];

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  // Wrapping the control in the label associates the two without needing an
  // id on every field, so clicking the label focuses the input and assistive
  // technology reads the two together.
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required && <span className="text-[var(--gold)]"> *</span>}
      </span>
      {children}
    </label>
  );
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { data: user, isLoading: userLoading } = useMe();
  const openAuth = useUiStore((s) => s.openAuth);
  const showToast = useUiStore((s) => s.showToast);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const createOrder = useCreateOrder();
  const mockConfirm = useMockConfirmPayment();

  const [step, setStep] = useState(1);
  const [placedOrder, setPlacedOrder] = useState<{ id: number; reference: string } | null>(null);
  const [address, setAddress] = useState<ShippingAddress>({
    first: "",
    last: "",
    email: user?.email ?? "",
    address: "",
    city: "",
    country: "ET",
    zip: "",
    phone: "",
  });

  // Shipping zone, VAT and the buyer's currency all follow the destination, so
  // the server prices the cart and the client only renders the answer.
  const quoteItems = items.map((i) => ({ product_id: i.productId, quantity: i.qty }));
  const { data: quote, isFetching: quoting } = useOrderQuote(quoteItems, address.country);

  if (userLoading) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-narrow)] mx-auto bg-[var(--bg-surface)] border border-[var(--border-gold)] rounded-2xl p-8">
          <Skeleton className="w-full h-8 mb-6" />
          <Skeleton className="w-full h-12 mb-4" />
          <Skeleton className="w-full h-12 mb-4" />
          <Skeleton className="w-full h-12" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-narrow)] mx-auto">
          <EmptyState
            icon={<CreditCard size={32} />}
            title={t("checkout.signInToCheckout")}
            action={
              <button className="btn btn-primary" onClick={() => openAuth("login")}>
                {t("common.signIn")}
              </button>
            }
          />
        </div>
      </section>
    );
  }

  if (items.length === 0 && !placedOrder) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-narrow)] mx-auto">
          <EmptyState
            icon={<Package size={32} />}
            title={t("checkout.cartEmpty")}
            action={
              <Link href="/store" className="btn btn-primary">
                {t("cart.browseStore")}
              </Link>
            }
          />
        </div>
      </section>
    );
  }

  if (placedOrder) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-[var(--container-narrow)] mx-auto text-center bg-[var(--bg-surface)] border border-[var(--border-gold)] rounded-2xl p-10">
          <CheckCircle size={56} weight="fill" className="text-[var(--success)] mx-auto mb-4" />
          <h3 className="display-heading mb-2">{t("checkout.orderPlaced")}</h3>
          <p className="text-[var(--text-secondary)] mb-1">
            {t("checkout.orderPlacedBody")}
          </p>
          <p className="text-sm text-[var(--text-muted)] font-mono mb-6">
            {t("checkout.orderNumber", { reference: placedOrder.reference })}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/orders" className="btn btn-outline">
              {t("checkout.viewOrders")}
            </Link>
            <Link href="/store" className="btn btn-primary">
              {t("checkout.continueShopping")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  async function handlePlaceOrder() {
    try {
      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({ product_id: i.productId, quantity: i.qty })),
        country: address.country,
        shipping_address: address,
      });
      await mockConfirm.mutateAsync(order.id);
      clearCart();
      setPlacedOrder({ id: order.id, reference: order.reference });
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("checkout.couldNotPlace"), "error");
    }
  }

  const placing = createOrder.isPending || mockConfirm.isPending;

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-narrow)] mx-auto bg-[var(--bg-surface)] border border-[var(--border-gold)] rounded-2xl p-8">
        <div className="flex gap-2 justify-center mb-8">
          {STEP_KEYS.map((s) => (
            <div
              key={s.n}
              className={`flex items-center gap-2 text-xs uppercase tracking-wide ${
                s.n === step
                  ? "text-[var(--gold)]"
                  : s.n < step
                  ? "text-[var(--success)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full border flex items-center justify-center font-semibold text-[0.7rem] ${
                  s.n === step
                    ? "bg-[var(--gold)] text-[var(--bg-deep)] border-[var(--gold)]"
                    : s.n < step
                    ? "bg-[var(--success)] text-[var(--success-ink)] border-[var(--success)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border-subtle)]"
                }`}
              >
                {s.n < step ? <CheckCircle size={14} weight="bold" /> : s.n}
              </span>
              {t(s.key)}
              {s.n < 3 && <span className="w-6 h-px bg-[var(--border-subtle)]" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h3 className="display-heading mb-6">{t("checkout.shippingInformation")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("checkout.firstName")} required>
                <input
                  className="input"
                  autoComplete="given-name"
                  value={address.first}
                  onChange={(e) => setAddress({ ...address, first: e.target.value })}
                />
              </Field>
              <Field label={t("checkout.lastName")} required>
                <input
                  className="input"
                  autoComplete="family-name"
                  value={address.last}
                  onChange={(e) => setAddress({ ...address, last: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("checkout.email")} required>
                  <input
                    className="input"
                    type="email"
                    autoComplete="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={t("checkout.address")} required>
                  <input
                    className="input"
                    autoComplete="street-address"
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                  />
                </Field>
              </div>
              <Field label={t("checkout.city")} required>
                <input
                  className="input"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
              </Field>
              <Field label={t("checkout.country")} required>
                <select
                  className="input"
                  autoComplete="country"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("checkout.zip")}>
                <input
                  className="input"
                  autoComplete="postal-code"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                />
              </Field>
              <Field label={t("checkout.phone")}>
                <input
                  className="input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex justify-end mt-8">
              <button
                className="btn btn-primary flex items-center gap-2"
                disabled={!address.first || !address.last || !address.email || !address.address || !address.city}
                onClick={() => setStep(2)}
              >
                {t("checkout.continueToPayment")} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="display-heading mb-6">{t("checkout.paymentMethod")}</h3>
            <div className="bg-[var(--bg-elevated)] rounded-lg p-6 mb-6">
              <p className="text-[var(--text-secondary)] mb-2">
                {t("checkout.pricedIn")}
              </p>
              <p className="text-[var(--gold)] font-semibold text-lg">
                {quote?.currency === "ETB" ? t("checkout.birr") : t("checkout.dollars")}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                {t("checkout.demoNotice")}
              </p>
            </div>
            <OrderSummary quote={quote} loading={quoting} />
            <div className="flex justify-between mt-8">
              <button className="btn btn-outline flex items-center gap-2" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> {t("common.back")}
              </button>
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={() => setStep(3)}
                disabled={!quote}
              >
                {t("checkout.reviewOrder")} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="display-heading mb-6">{t("checkout.confirmOrder")}</h3>
            <OrderSummary quote={quote} loading={quoting} />
            <div className="mt-4 p-4 bg-[var(--bg-deep)] rounded-lg text-sm text-[var(--text-secondary)] flex flex-col gap-2">
              <p className="flex items-start gap-2">
                <Package size={16} className="text-[var(--gold)] mt-0.5 shrink-0" />
                {t("checkout.shippingTo")}: {address.first} {address.last}, {address.address}, {address.city},{" "}
                {COUNTRIES.find((c) => c.value === address.country)?.label}
              </p>
              <p className="flex items-center gap-2">
                <CreditCard size={16} className="text-[var(--gold)] shrink-0" />{" "}
                {t("checkout.payment")}: {t("checkout.simulated")}
              </p>
            </div>
            <div className="flex justify-between mt-8">
              <button
                className="btn btn-outline flex items-center gap-2"
                onClick={() => setStep(2)}
                disabled={placing}
              >
                <ArrowLeft size={16} /> {t("common.back")}
              </button>
              <button className="btn btn-success" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? t("checkout.placing") : t("checkout.placeOrder")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderSummary({ quote, loading }: { quote?: OrderQuote; loading: boolean }) {
  const { t } = useTranslation();
  if (!quote) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-lg p-6 flex flex-col gap-3">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-6" />
      </div>
    );
  }

  const money = (cents: number) => formatMoney(cents, quote.currency, quote.fxRate);

  return (
    <div
      className={`bg-[var(--bg-elevated)] rounded-lg p-6 transition-opacity ${
        loading ? "opacity-60" : ""
      }`}
      aria-busy={loading}
    >
      <SummaryRow label={t("checkout.subtotal")} value={money(quote.subtotalCents)} />
      <SummaryRow
        label={t("checkout.shipping")}
        value={quote.freeShippingApplied ? t("common.free") : money(quote.shippingCents)}
      />
      {quote.taxCents > 0 && <SummaryRow label={quote.taxLabel} value={money(quote.taxCents)} />}
      <div className="flex justify-between pt-3 mt-2 border-t-2 border-[var(--gold)] font-bold text-white">
        <span>{t("checkout.total")}</span>
        <span>{money(quote.totalCents)}</span>
      </div>
      {quote.currency !== "USD" && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {t("checkout.convertedAt", { rate: quote.fxRate.toLocaleString("en-US") })}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--gold)]">{value}</span>
    </div>
  );
}
