"use client";

import { useState } from "react";
import Link from "next/link";
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
  { value: "ET", label: "Ethiopia" },
  { value: "KE", label: "Kenya" },
  { value: "DJ", label: "Djibouti" },
  { value: "SO", label: "Somalia" },
  { value: "ER", label: "Eritrea" },
  { value: "SD", label: "Sudan" },
];

const PITCH = [
  {
    icon: Globe,
    title: "Reach buyers worldwide",
    body: "Your goods sit alongside Ethiopia's best, in front of retail buyers and commercial importers.",
  },
  {
    icon: Percent,
    title: "One clear commission",
    body: "15% on what sells. No listing fees, no monthly charge, no surprises.",
  },
  {
    icon: ChartLineUp,
    title: "Tools that do the work",
    body: "Inventory, orders, fulfilment and payout history in one dashboard.",
  },
];

export default function SellPage() {
  const { data: user, isLoading: userLoading } = useMe();
  const openAuth = useUiStore((s) => s.openAuth);
  const { data: application, isLoading: applicationLoading } = useMyVendorApplication(!!user);

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <PageHeader
          title="Sell on AURION"
          description="Ethiopian producers, cooperatives and exporters — bring your goods to a global counter."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {PITCH.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-6"
            >
              <p.icon size={24} className="text-[var(--gold)]" />
              <h3 className="mt-3 text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{p.body}</p>
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
  return (
    <div className="rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-8 text-center">
      <Storefront size={32} className="text-[var(--gold)] mx-auto mb-3" />
      <h3 className="display-heading mb-2">Sign in to apply</h3>
      <p className="text-[var(--text-secondary)] mb-6">
        Applications are tied to your AURION account. Create one or sign in to get started.
      </p>
      <button className="btn btn-primary" onClick={onSignIn}>
        Sign In
      </button>
    </div>
  );
}

function ApplicationStatus({ status, note }: { status: string; note: string | null }) {
  const config = {
    pending: {
      icon: Clock,
      tone: "var(--warning)",
      title: "Application received",
      body: "Our team is reviewing your details. We will be in touch once a decision is made.",
    },
    active: {
      icon: CheckCircle,
      tone: "var(--success)",
      title: "You're approved",
      body: "Your store is live. Head to your vendor dashboard to list your first product.",
    },
    rejected: {
      icon: XCircle,
      tone: "var(--danger)",
      title: "Application not approved",
      body: "We could not approve this application. Contact us if you believe this is a mistake.",
    },
    suspended: {
      icon: XCircle,
      tone: "var(--danger)",
      title: "Store suspended",
      body: "Your store is currently suspended. Contact our team to resolve it.",
    },
  }[status] ?? {
    icon: Clock,
    tone: "var(--text-muted)",
    title: "Application status",
    body: "We are processing your application.",
  };

  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-8">
      <Icon size={32} weight="fill" style={{ color: config.tone }} />
      <h3 className="display-heading mt-3 mb-2">{config.title}</h3>
      <p className="text-[var(--text-secondary)]">{config.body}</p>
      {note && (
        <p className="mt-3 rounded-lg bg-[var(--bg-deep)] p-3 text-sm text-[var(--text-muted)]">
          {note}
        </p>
      )}
      {status === "active" && (
        <Link href="/vendor" className="btn btn-primary mt-6 inline-flex">
          Open your dashboard
        </Link>
      )}
    </div>
  );
}

function ApplicationForm({ defaultName }: { defaultName: string }) {
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
      showToast("Application submitted. We'll review it shortly.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not submit your application.", "error");
    }
  }

  const ready =
    values.store_name && values.contact_name && values.contact_phone && values.country;

  return (
    <form
      className="rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      <h3 className="display-heading mb-6">Tell us about your business</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="store_name">
            Store name <span className="text-[var(--gold)]">*</span>
          </label>
          <input
            id="store_name"
            className="input"
            value={values.store_name}
            onChange={(e) => set("store_name", e.target.value)}
            required
          />
          <p className="field-help">The name buyers will see on your products.</p>
        </div>

        <div>
          <label className="field-label" htmlFor="contact_name">
            Contact name <span className="text-[var(--gold)]">*</span>
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
            Phone <span className="text-[var(--gold)]">*</span>
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
            Country <span className="text-[var(--gold)]">*</span>
          </label>
          <select
            id="country"
            className="input"
            value={values.country}
            onChange={(e) => set("country", e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="city">
            City or region
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
            What do you sell?
          </label>
          <input
            id="product_focus"
            className="input"
            value={values.product_focus}
            onChange={(e) => set("product_focus", e.target.value)}
            placeholder="Specialty coffee, honey, handwoven textiles…"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="business_registration">
            Business registration number
          </label>
          <input
            id="business_registration"
            className="input"
            value={values.business_registration}
            onChange={(e) => set("business_registration", e.target.value)}
          />
          <p className="field-help">Helps us verify you faster. Optional at this stage.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="website">
            Website or social page
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
            About your business
          </label>
          <textarea
            id="bio"
            className="input"
            rows={4}
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Where you grow or make it, how long you have been doing it, what makes it yours."
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-[var(--text-muted)]">
          AURION charges 15% commission on sales. No listing or monthly fees.
        </p>
        <button type="submit" className="btn btn-primary" disabled={!ready || submit.isPending}>
          {submit.isPending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
