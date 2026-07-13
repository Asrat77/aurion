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
import { useCartStore, cartTotalCents } from "@/store/cart";
import { useCreateOrder, useMockConfirmPayment, type ShippingAddress } from "@/lib/orders";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

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

function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STEPS = [
  { n: 1, label: "Shipping" },
  { n: 2, label: "Payment" },
  { n: 3, label: "Confirm" },
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
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span className="text-[var(--gold)]"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
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

  const subtotal = cartTotalCents(items);
  const shipping = subtotal > 0 ? 500 : 0;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;
  const gateway = address.country === "ET" ? "Chapa (ETB)" : "Stripe (USD)";

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
            title="Sign in to check out"
            action={
              <button className="btn btn-primary" onClick={() => openAuth("login")}>
                Sign In
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
            title="Your cart is empty"
            action={
              <Link href="/store" className="btn btn-primary">
                Browse the Store
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
          <h3 className="display-heading mb-2">Order Placed</h3>
          <p className="text-[var(--text-secondary)] mb-1">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <p className="text-sm text-[var(--text-muted)] font-mono mb-6">
            Order #{placedOrder.reference}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/orders" className="btn btn-outline">
              View Orders
            </Link>
            <Link href="/store" className="btn btn-primary">
              Continue Shopping
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
      showToast(err instanceof ApiError ? err.message : "Could not place order.", "error");
    }
  }

  const placing = createOrder.isPending || mockConfirm.isPending;

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-narrow)] mx-auto bg-[var(--bg-surface)] border border-[var(--border-gold)] rounded-2xl p-8">
        <div className="flex gap-2 justify-center mb-8">
          {STEPS.map((s) => (
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
              {s.label}
              {s.n < 3 && <span className="w-6 h-px bg-[var(--border-subtle)]" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h3 className="display-heading mb-6">Shipping Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name" required>
                <input
                  className="input"
                  value={address.first}
                  onChange={(e) => setAddress({ ...address, first: e.target.value })}
                />
              </Field>
              <Field label="Last name" required>
                <input
                  className="input"
                  value={address.last}
                  onChange={(e) => setAddress({ ...address, last: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email" required>
                  <input
                    className="input"
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" required>
                  <input
                    className="input"
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="City" required>
                <input
                  className="input"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
              </Field>
              <Field label="Country" required>
                <select
                  className="input"
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
              <Field label="ZIP / Postal code">
                <input
                  className="input"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  className="input"
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
                Continue to Payment <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="display-heading mb-6">Payment Method</h3>
            <div className="bg-[var(--bg-elevated)] rounded-lg p-6 mb-6">
              <p className="text-[var(--text-secondary)] mb-2">
                Based on your shipping country, payment will be processed via
              </p>
              <p className="text-[var(--gold)] font-semibold text-lg">{gateway}</p>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Demo mode: no payment provider is configured yet, so checkout completes
                instantly via a simulated payment.
              </p>
            </div>
            <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
            <div className="flex justify-between mt-8">
              <button className="btn btn-outline flex items-center gap-2" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary flex items-center gap-2" onClick={() => setStep(3)}>
                Review Order <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="display-heading mb-6">Confirm Order</h3>
            <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
            <div className="mt-4 p-4 bg-[var(--bg-deep)] rounded-lg text-sm text-[var(--text-secondary)] flex flex-col gap-2">
              <p className="flex items-start gap-2">
                <Package size={16} className="text-[var(--gold)] mt-0.5 shrink-0" />
                Shipping to: {address.first} {address.last}, {address.address}, {address.city},{" "}
                {COUNTRIES.find((c) => c.value === address.country)?.label}
              </p>
              <p className="flex items-center gap-2">
                <CreditCard size={16} className="text-[var(--gold)] shrink-0" /> Payment: {gateway}
              </p>
            </div>
            <div className="flex justify-between mt-8">
              <button
                className="btn btn-outline flex items-center gap-2"
                onClick={() => setStep(2)}
                disabled={placing}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-success" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? "Placing Order…" : "Place Order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OrderSummary({
  subtotal,
  shipping,
  tax,
  total,
}: {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-lg p-6">
      <SummaryRow label="Subtotal" value={formatUsd(subtotal)} />
      <SummaryRow label="Shipping" value={formatUsd(shipping)} />
      <SummaryRow label="Tax (VAT)" value={formatUsd(tax)} />
      <div className="flex justify-between pt-3 mt-2 border-t-2 border-[var(--gold)] font-bold text-white">
        <span>Total</span>
        <span>{formatUsd(total)}</span>
      </div>
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
