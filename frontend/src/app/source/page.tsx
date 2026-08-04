"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
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
  INCOTERMS,
  type RequestForQuoteInput,
} from "@/lib/requestForQuotes";
import WholesaleCatalogue from "@/components/source/WholesaleCatalogue";
import type { Incoterm, Product, RequestForQuote } from "@/types";

const INITIAL_FORM: RequestForQuoteInput = {
  company_name: "",
  contact_name: "",
  email: "",
  country: "",
  product_interest: "",
  estimated_quantity: "",
  specifications: "",
  incoterm: "",
  destination_port: "",
  sample_requested: false,
};

const PRODUCT_OPTIONS = [
  { value: "Specialty coffee", key: "source.specialtyCoffee" },
  { value: "Teff and grains", key: "source.teffGrains" },
  { value: "Oilseeds and pulses", key: "source.oilseedsPulses" },
  { value: "Honey and spices", key: "source.honeySpices" },
  { value: "Textiles and cultural goods", key: "source.textilesCultural" },
  { value: "Jewelry and gemstones", key: "source.jewelryGemstones" },
  { value: "Other Ethiopian products", key: "source.otherProducts" },
];

export default function SourcePage() {
  const { t } = useTranslation();
  const createRequest = useCreateRequestForQuote();
  const [form, setForm] = useState(INITIAL_FORM);
  const [created, setCreated] = useState<RequestForQuote | null>(null);
  const [error, setError] = useState("");

  function update(field: keyof RequestForQuoteInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // Picking a line from the catalogue pre-fills the request and scrolls the
  // buyer to the form, so they never retype what the card already told us.
  function requestQuoteFor(product: Product) {
    setForm((current) => ({
      ...current,
      product_id: product.id,
      product_interest: current.product_interest || product.category.name,
      estimated_quantity:
        current.estimated_quantity ||
        (product.wholesale
          ? `${product.wholesale.moq.toLocaleString()} ${product.wholesale.unitOfMeasure ?? "units"}`
          : ""),
      specifications:
        current.specifications || `Interested in ${product.name} (${product.origin}).`,
    }));
    document.getElementById("source-form-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          : t("source.couldNotSubmit"),
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
            <p className="section-label">{t("source.desk")}</p>
            <h1 className="display-title max-w-[620px]">
              {t("source.title")}
            </h1>
            <p className="mt-7 max-w-[570px] text-base leading-[1.9] text-[var(--text-secondary)] lg:text-lg">
              {t("source.intro")}
            </p>

            <div className="mt-10 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              <SourcePromise
                icon={Package}
                title={t("source.commercialQuantities")}
                body={t("source.commercialQuantitiesBody")}
              />
              <SourcePromise
                icon={GlobeHemisphereWest}
                title={t("source.destinationAware")}
                body={t("source.destinationAwareBody")}
              />
              <SourcePromise
                icon={ShieldCheck}
                title={t("source.requirementLed")}
                body={t("source.requirementLedBody")}
              />
            </div>

            <Link href="/store" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold)] hover:text-white">
              <ArrowLeft size={16} /> {t("source.retailLink")}
            </Link>

            <div className="mt-14">
              <span className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em] text-[var(--gold)]">
                {t("source.availableScale")}
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
                {t("source.commercialLines")}
              </h2>
              <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-[var(--text-secondary)]">
                {t("source.commercialLinesBody")}
              </p>
              <div className="mt-7">
                <WholesaleCatalogue onRequestQuote={requestQuoteFor} />
              </div>
            </div>
          </div>

          <div className="source-form-shell rounded-[28px] border border-[var(--border-gold)] bg-[rgba(9,13,22,0.9)] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-9 lg:p-12">
            <div className="mb-9 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em] text-[var(--gold)]">
                  {t("source.inquiry")}
                </span>
                <h2 id="source-form-title" className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
                  {t("source.formTitle")}
                </h2>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{t("source.requiredFields")}</span>
            </div>

            {error ? (
              <div role="alert" className="mb-6 rounded-xl border border-[rgba(224,85,85,0.35)] bg-[rgba(224,85,85,0.08)] p-4 text-sm text-[#ef8c8c]">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} aria-labelledby="source-form-title" className="grid gap-5 sm:grid-cols-2">
              <Field label={t("source.companyName")} htmlFor="company-name" required>
                <input
                  id="company-name"
                  className="input"
                  autoComplete="organization"
                  required
                  value={form.company_name}
                  onChange={(event) => update("company_name", event.target.value)}
                  placeholder={t("source.companyPlaceholder")}
                />
              </Field>

              <Field label={t("source.contactPerson")} htmlFor="contact-name">
                <input
                  id="contact-name"
                  className="input"
                  autoComplete="name"
                  value={form.contact_name}
                  onChange={(event) => update("contact_name", event.target.value)}
                  placeholder={t("source.fullNamePlaceholder")}
                />
              </Field>

              <Field label={t("source.workEmail")} htmlFor="work-email" required>
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

              <Field label={t("source.destinationCountry")} htmlFor="destination-country">
                <input
                  id="destination-country"
                  className="input"
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(event) => update("country", event.target.value)}
                  placeholder={t("source.countryPlaceholder")}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label={t("source.productInterest")} htmlFor="product-interest" required>
                  <select
                    id="product-interest"
                    className="input"
                    required
                    value={form.product_interest}
                    onChange={(event) => update("product_interest", event.target.value)}
                  >
                    <option value="">{t("source.chooseProduct")}</option>
                    {PRODUCT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{t(option.key)}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label={t("source.estimatedQuantity")} htmlFor="estimated-quantity">
                  <input
                    id="estimated-quantity"
                    className="input"
                    value={form.estimated_quantity}
                    onChange={(event) => update("estimated_quantity", event.target.value)}
                    placeholder={t("source.quantityPlaceholder")}
                  />
                </Field>
              </div>

              <Field label={t("source.deliveryTerms")} htmlFor="incoterm">
                <select
                  id="incoterm"
                  className="input"
                  value={form.incoterm ?? ""}
                  onChange={(event) => update("incoterm", event.target.value as Incoterm)}
                >
                  <option value="">{t("source.notSureYet")}</option>
                  {INCOTERMS.map((option) => (
                    <option key={option.value} value={option.value}>{t(`source.incoterm.${option.value}`)}</option>
                  ))}
                </select>
              </Field>

              <Field label={t("source.destinationPort")} htmlFor="destination-port">
                <input
                  id="destination-port"
                  className="input"
                  value={form.destination_port ?? ""}
                  onChange={(event) => update("destination_port", event.target.value)}
                  placeholder={t("source.destinationPlaceholder")}
                />
              </Field>

              <div className="sm:col-span-2">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--gold)]"
                    checked={form.sample_requested ?? false}
                    onChange={(event) => update("sample_requested", event.target.checked)}
                  />
                  {t("source.sampleRequest")}
                </label>
              </div>

              <div className="sm:col-span-2">
                <Field label={t("source.specifications")} htmlFor="specifications">
                  <textarea
                    id="specifications"
                    className="input min-h-[150px] resize-y"
                    value={form.specifications}
                    onChange={(event) => update("specifications", event.target.value)}
                    placeholder={t("source.specificationsPlaceholder")}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2 mt-2 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-7 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-[430px] text-xs leading-relaxed text-[var(--text-muted)]">
                  {t("source.disclaimer")}
                </p>
                <button
                  type="submit"
                  className="btn btn-primary inline-flex items-center justify-center gap-2"
                  disabled={createRequest.isPending}
                >
                  {createRequest.isPending ? t("source.submitting") : t("source.submitRequest")}
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
  const { t } = useTranslation();

  return (
    <section className="relative flex min-h-[82svh] items-center overflow-hidden px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <div className="absolute inset-0 aurion-pattern opacity-[0.16]" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(214,180,94,0.08)] blur-[130px]" />
      <div className="relative mx-auto w-full max-w-[780px] rounded-[30px] border border-[var(--border-gold)] bg-[rgba(9,13,22,0.94)] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:p-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-gold-strong)] bg-[rgba(214,180,94,0.08)] text-[var(--gold-light)]">
          <CheckCircle size={38} weight="light" />
        </div>
        <p className="section-label mt-7">{t("source.requestReceived")}</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-white sm:text-6xl">
          {t("source.confirmationTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-[590px] leading-[1.9] text-[var(--text-secondary)]">
          {t("source.confirmationBody", { company: requestForQuote.companyName })}
        </p>
        <div className="mx-auto mt-8 max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-5">
          <span className="block font-[family-name:var(--font-mono)] text-[0.58rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">{t("source.rfqReference")}</span>
          <strong className="mt-2 block font-[family-name:var(--font-mono)] text-xl tracking-[0.08em] text-[var(--gold-light)] sm:text-2xl">
            {requestForQuote.reference}
          </strong>
        </div>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/store" className="btn btn-primary inline-flex items-center justify-center gap-2">
            {t("source.exploreMarketplace")} <ArrowRight size={17} />
          </Link>
          <button type="button" onClick={onReset} className="btn btn-outline">
            {t("source.anotherRequest")}
          </button>
        </div>
      </div>
    </section>
  );
}
