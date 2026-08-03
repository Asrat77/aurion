"use client";

import { useState } from "react";
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  GlobeHemisphereWest,
  Package,
  ShieldCheck,
} from "@phosphor-icons/react";
import { ApiError } from "@/lib/api";
import {
  useCreateRequestForQuote,
  type RequestForQuoteInput,
} from "@/lib/requestForQuotes";
import type { RequestForQuote } from "@/types";

const INITIAL_FORM: RequestForQuoteInput = {
  company_name: "",
  contact_name: "",
  email: "",
  country: "",
  product_interest: "",
  estimated_quantity: "",
  specifications: "",
};

const PRODUCT_OPTIONS = [
  "Specialty coffee",
  "Teff and grains",
  "Oilseeds and pulses",
  "Honey and spices",
  "Textiles and cultural goods",
  "Jewelry and gemstones",
  "Other Ethiopian products",
];

export default function SourcePage() {
  const createRequest = useCreateRequestForQuote();
  const [form, setForm] = useState(INITIAL_FORM);
  const [created, setCreated] = useState<RequestForQuote | null>(null);
  const [error, setError] = useState("");

  function update(field: keyof RequestForQuoteInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const requestForQuote = await createRequest.mutateAsync(form);
      setCreated(requestForQuote);
      setForm(INITIAL_FORM);
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We could not submit your request. Please try again.",
      );
    }
  }

  if (created) {
    return <RequestConfirmation requestForQuote={created} onReset={() => setCreated(null)} />;
  }

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-36 sm:px-6 lg:px-8 lg:pb-32 lg:pt-44">
      <div className="absolute inset-0 aurion-pattern opacity-[0.14]" />
      <div className="absolute -right-40 top-12 h-[560px] w-[560px] rounded-full bg-[var(--blue-glow)] blur-[150px]" />

      <div className="relative mx-auto max-w-[var(--container-wide)]">
        <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div className="lg:sticky lg:top-36 lg:self-start">
            <p className="section-label">AURION sourcing desk</p>
            <h1 className="display-title max-w-[620px]">
              Source Ethiopia with a clearer first step.
            </h1>
            <p className="mt-7 max-w-[570px] text-base leading-[1.9] text-[var(--text-secondary)] lg:text-lg">
              Share the product, destination, quantity, and commercial context. Your request
              is recorded with a reference for direct follow-up.
            </p>

            <div className="mt-10 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              <SourcePromise
                icon={Package}
                title="Built for commercial quantities"
                body="Describe bulk, container, or recurring requirements in your own terms."
              />
              <SourcePromise
                icon={GlobeHemisphereWest}
                title="Destination-aware"
                body="Include the market and specifications that shape the request."
              />
              <SourcePromise
                icon={ShieldCheck}
                title="Requirement-led sourcing"
                body="Certifications, pricing, and documentation are discussed against the actual requirement."
              />
            </div>

            <Link href="/store" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold)] hover:text-white">
              <ArrowLeft size={16} /> Looking for retail products?
            </Link>
          </div>

          <div className="source-form-shell rounded-[28px] border border-[var(--border-gold)] bg-[rgba(9,13,22,0.9)] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-9 lg:p-12">
            <div className="mb-9 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em] text-[var(--gold)]">
                  Commercial inquiry
                </span>
                <h2 id="source-form-title" className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
                  Tell us what you need.
                </h2>
              </div>
              <span className="text-xs text-[var(--text-muted)]">Required fields marked *</span>
            </div>

            {error ? (
              <div role="alert" className="mb-6 rounded-xl border border-[rgba(224,85,85,0.35)] bg-[rgba(224,85,85,0.08)] p-4 text-sm text-[#ef8c8c]">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} aria-labelledby="source-form-title" className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name" htmlFor="company-name" required>
                <input
                  id="company-name"
                  className="input"
                  autoComplete="organization"
                  required
                  value={form.company_name}
                  onChange={(event) => update("company_name", event.target.value)}
                  placeholder="Your company"
                />
              </Field>

              <Field label="Contact person" htmlFor="contact-name">
                <input
                  id="contact-name"
                  className="input"
                  autoComplete="name"
                  value={form.contact_name}
                  onChange={(event) => update("contact_name", event.target.value)}
                  placeholder="Full name"
                />
              </Field>

              <Field label="Work email" htmlFor="work-email" required>
                <input
                  id="work-email"
                  className="input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="buyer@company.com"
                />
              </Field>

              <Field label="Destination country" htmlFor="destination-country">
                <input
                  id="destination-country"
                  className="input"
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(event) => update("country", event.target.value)}
                  placeholder="Country or market"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Product of interest" htmlFor="product-interest" required>
                  <select
                    id="product-interest"
                    className="input"
                    required
                    value={form.product_interest}
                    onChange={(event) => update("product_interest", event.target.value)}
                  >
                    <option value="">Choose a product group</option>
                    {PRODUCT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Estimated quantity" htmlFor="estimated-quantity">
                  <input
                    id="estimated-quantity"
                    className="input"
                    value={form.estimated_quantity}
                    onChange={(event) => update("estimated_quantity", event.target.value)}
                    placeholder="For example: 20 tons, one container, or a recurring monthly order"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Specifications and context" htmlFor="specifications">
                  <textarea
                    id="specifications"
                    className="input min-h-[150px] resize-y"
                    value={form.specifications}
                    onChange={(event) => update("specifications", event.target.value)}
                    placeholder="Packaging, grade, target timeline, documentation needs, or other useful context"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2 mt-2 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-7 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-[430px] text-xs leading-relaxed text-[var(--text-muted)]">
                  Submitting creates an RFQ reference. It does not confirm price, stock,
                  certification, or shipping terms.
                </p>
                <button
                  type="submit"
                  className="btn btn-primary inline-flex items-center justify-center gap-2"
                  disabled={createRequest.isPending}
                >
                  {createRequest.isPending ? "Submitting request…" : "Submit sourcing request"}
                  {!createRequest.isPending ? <ArrowRight size={17} /> : null}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label} {required ? <span aria-hidden="true" className="text-[var(--gold)]">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function SourcePromise({
  icon: Icon,
  title,
  body,
}: {
  icon: Icon;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[44px_1fr] gap-4 py-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-gold)] text-[var(--gold)]">
        <Icon size={20} />
      </span>
      <span>
        <strong className="block text-sm text-[var(--text-primary)]">{title}</strong>
        <span className="mt-1 block text-sm leading-relaxed text-[var(--text-muted)]">{body}</span>
      </span>
    </div>
  );
}

function RequestConfirmation({
  requestForQuote,
  onReset,
}: {
  requestForQuote: RequestForQuote;
  onReset: () => void;
}) {
  return (
    <section className="relative flex min-h-[82svh] items-center overflow-hidden px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <div className="absolute inset-0 aurion-pattern opacity-[0.16]" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(214,180,94,0.08)] blur-[130px]" />
      <div className="relative mx-auto w-full max-w-[780px] rounded-[30px] border border-[var(--border-gold)] bg-[rgba(9,13,22,0.94)] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:p-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-gold-strong)] bg-[rgba(214,180,94,0.08)] text-[var(--gold-light)]">
          <CheckCircle size={38} weight="light" />
        </div>
        <p className="section-label mt-7">Request received</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-white sm:text-6xl">
          The conversation has a starting point.
        </h1>
        <p className="mx-auto mt-6 max-w-[590px] leading-[1.9] text-[var(--text-secondary)]">
          Your sourcing request from {requestForQuote.companyName} is now in the AURION desk.
          Keep the reference below for follow-up.
        </p>
        <div className="mx-auto mt-8 max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-5">
          <span className="block font-[family-name:var(--font-mono)] text-[0.58rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">RFQ reference</span>
          <strong className="mt-2 block font-[family-name:var(--font-mono)] text-xl tracking-[0.08em] text-[var(--gold-light)] sm:text-2xl">
            {requestForQuote.reference}
          </strong>
        </div>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/store" className="btn btn-primary inline-flex items-center justify-center gap-2">
            Explore the marketplace <ArrowRight size={17} />
          </Link>
          <button type="button" onClick={onReset} className="btn btn-outline">
            Submit another request
          </button>
        </div>
      </div>
    </section>
  );
}
