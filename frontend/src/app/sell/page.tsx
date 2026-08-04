"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Storefront,
  CheckCircle,
  Clock,
  XCircle,
  Globe,
  Percent,
  ChartLineUp,
} from "@phosphor-icons/react";
import { useMe } from "@/lib/auth";
import { useUiStore } from "@/store/ui";
import {
  useMyVendorApplication,
  useSubmitVendorApplication,
  type VendorApplicationInput,
} from "@/lib/vendorApplication";
import { ApiError } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

const COUNTRIES = [
  { value: "ET", key: "country.ethiopia" },
  { value: "KE", key: "country.kenya" },
  { value: "DJ", key: "country.djibouti" },
  { value: "SO", key: "country.somalia" },
  { value: "ER", key: "country.eritrea" },
  { value: "SD", key: "country.sudan" },
];

const PITCH = [
  {
    icon: Globe,
    title: "sell.reachWorldwide",
    body: "sell.reachWorldwideBody",
  },
  {
    icon: Percent,
    title: "sell.clearCommission",
    body: "sell.clearCommissionBody",
  },
  {
    icon: ChartLineUp,
    title: "sell.toolsWork",
    body: "sell.toolsWorkBody",
  },
];

export default function SellPage() {
  const { t } = useTranslation();
  const { data: user, isLoading: userLoading } = useMe();
  const openAuth = useUiStore((s) => s.openAuth);
  const { data: application, isLoading: applicationLoading } = useMyVendorApplication(!!user);

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <PageHeader
          title={t("sell.title")}
          description={t("sell.description")}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {PITCH.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-6"
            >
              <p.icon size={24} className="text-[var(--gold)]" />
              <h3 className="mt-3 text-base font-semibold text-white">{t(p.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{t(p.body)}</p>
            </article>
          ))}
        </div>

        {userLoading || (user && applicationLoading) ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-12" />
          </div>
        ) : !user ? (
          <SignInPrompt onSignIn={() => openAuth("login")} />
        ) : application ? (
          <ApplicationStatus status={application.status} note={application.reviewNote} />
        ) : (
          <ApplicationForm defaultName={user.name} />
        )}
      </div>
    </section>
  );
}

function SignInPrompt({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-8 text-center">
      <Storefront size={32} className="text-[var(--gold)] mx-auto mb-3" />
      <h3 className="display-heading mb-2">{t("sell.signInApply")}</h3>
      <p className="text-[var(--text-secondary)] mb-6">
        {t("sell.accountLinkBody")}
      </p>
      <button className="btn btn-primary" onClick={onSignIn}>
        {t("common.signIn")}
      </button>
    </div>
  );
}

function ApplicationStatus({ status, note }: { status: string; note: string | null }) {
  const { t } = useTranslation();
  const config = {
    pending: {
      icon: Clock,
      tone: "var(--warning)",
      title: "sell.applicationReceived",
      body: "sell.applicationReceivedBody",
    },
    active: {
      icon: CheckCircle,
      tone: "var(--success)",
      title: "sell.approved",
      body: "sell.approvedBody",
    },
    rejected: {
      icon: XCircle,
      tone: "var(--danger)",
      title: "sell.notApproved",
      body: "sell.notApprovedBody",
    },
    suspended: {
      icon: XCircle,
      tone: "var(--danger)",
      title: "sell.suspended",
      body: "sell.suspendedBody",
    },
  }[status] ?? {
    icon: Clock,
    tone: "var(--text-muted)",
    title: "sell.status",
    body: "sell.statusBody",
  };

  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-8">
      <Icon size={32} weight="fill" style={{ color: config.tone }} />
      <h3 className="display-heading mt-3 mb-2">{t(config.title)}</h3>
      <p className="text-[var(--text-secondary)]">{t(config.body)}</p>
      {note && (
        <p className="mt-3 rounded-lg bg-[var(--bg-deep)] p-3 text-sm text-[var(--text-muted)]">
          {note}
        </p>
      )}
      {status === "active" && (
        <Link href="/vendor" className="btn btn-primary mt-6 inline-flex">
          {t("sell.openDashboard")}
        </Link>
      )}
    </div>
  );
}

function ApplicationForm({ defaultName }: { defaultName: string }) {
  const { t } = useTranslation();
  const submit = useSubmitVendorApplication();
  const showToast = useUiStore((s) => s.showToast);

  const [values, setValues] = useState<VendorApplicationInput>({
    store_name: "",
    contact_name: defaultName,
    contact_phone: "",
    country: "ET",
    city: "",
    product_focus: "",
    business_registration: "",
    website: "",
    bio: "",
  });

  function set<K extends keyof VendorApplicationInput>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submit.mutateAsync(values);
      showToast(t("sell.submitted"), "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("sell.submitFailed"), "error");
    }
  }

  const ready =
    values.store_name && values.contact_name && values.contact_phone && values.country;

  return (
    <form
      className="rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      <h3 className="display-heading mb-6">{t("sell.businessTitle")}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="store_name">
            {t("sell.storeName")} <span className="text-[var(--gold)]">*</span>
          </label>
          <input
            id="store_name"
            className="input"
            value={values.store_name}
            onChange={(e) => set("store_name", e.target.value)}
            required
          />
          <p className="field-help">{t("sell.storeNameHelp")}</p>
        </div>

        <div>
          <label className="field-label" htmlFor="contact_name">
            {t("sell.contactName")} <span className="text-[var(--gold)]">*</span>
          </label>
          <input
            id="contact_name"
            className="input"
            value={values.contact_name}
            onChange={(e) => set("contact_name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor="contact_phone">
            {t("sell.phone")} <span className="text-[var(--gold)]">*</span>
          </label>
          <input
            id="contact_phone"
            className="input"
            value={values.contact_phone}
            onChange={(e) => set("contact_phone", e.target.value)}
            placeholder="+251 …"
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor="country">
            {t("sell.country")} <span className="text-[var(--gold)]">*</span>
          </label>
          <select
            id="country"
            className="input"
            value={values.country}
            onChange={(e) => set("country", e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.key)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="city">
            {t("sell.cityRegion")}
          </label>
          <input
            id="city"
            className="input"
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="product_focus">
            {t("sell.whatSell")}
          </label>
          <input
            id="product_focus"
            className="input"
            value={values.product_focus}
            onChange={(e) => set("product_focus", e.target.value)}
            placeholder={t("sell.whatSellPlaceholder")}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="business_registration">
            {t("sell.registration")}
          </label>
          <input
            id="business_registration"
            className="input"
            value={values.business_registration}
            onChange={(e) => set("business_registration", e.target.value)}
          />
          <p className="field-help">{t("sell.registrationHelp")}</p>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="website">
            {t("sell.website")}
          </label>
          <input
            id="website"
            className="input"
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="bio">
            {t("sell.aboutBusiness")}
          </label>
          <textarea
            id="bio"
            className="input"
            rows={4}
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder={t("sell.aboutPlaceholder")}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-[var(--text-muted)]">
          {t("sell.commissionNote")}
        </p>
        <button type="submit" className="btn btn-primary" disabled={!ready || submit.isPending}>
          {submit.isPending ? t("sell.submitting") : t("sell.submitApplication")}
        </button>
      </div>
    </form>
  );
}
