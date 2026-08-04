"use client";

import Link from "next/link";
import { ShieldCheck, Package, ArrowsClockwise, Scales, Clock } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/ui/PageHeader";

const COVERAGE = [
  { icon: Package, title: "buyerProtection.neverArrived", body: "buyerProtection.neverArrivedBody" },
  { icon: ArrowsClockwise, title: "buyerProtection.damaged", body: "buyerProtection.damagedBody" },
  { icon: Scales, title: "buyerProtection.notDescribed", body: "buyerProtection.notDescribedBody" },
];

const STEPS = ["buyerProtection.step1", "buyerProtection.step2", "buyerProtection.step3", "buyerProtection.step4"];

export default function BuyerProtectionContent() {
  const { t } = useTranslation();

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <PageHeader title={t("buyerProtection.title")} description={t("buyerProtection.description")} />

        <div className="flex items-start gap-4 rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-6">
          <ShieldCheck size={28} weight="fill" className="text-[var(--gold)] shrink-0" />
          <p className="text-[var(--text-secondary)] leading-relaxed">{t("buyerProtection.intro")}</p>
        </div>

        <h2 className="display-heading mt-12 mb-5">{t("buyerProtection.covered")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COVERAGE.map((coverage) => {
            const Icon = coverage.icon;
            return (
              <article key={coverage.title} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-6">
                <Icon size={24} className="text-[var(--gold)]" />
                <h3 className="mt-3 text-base font-semibold text-white">{t(coverage.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{t(coverage.body)}</p>
              </article>
            );
          })}
        </div>

        <h2 className="display-heading mt-12 mb-5">{t("buyerProtection.howItWorks")}</h2>
        <ol className="flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-gold)] font-mono text-sm text-[var(--gold)]">{i + 1}</span>
              <p className="pt-1 text-[var(--text-secondary)] leading-relaxed">{t(step)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-6">
          <Clock size={24} className="text-[var(--gold)] shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-white">{t("buyerProtection.claimWindow")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{t("buyerProtection.claimWindowBody")}</p>
          </div>
        </div>

        <p className="mt-10 text-sm text-[var(--text-muted)]">
          {t("buyerProtection.specificOrder")} {" "}
          <Link href="/orders" className="text-[var(--gold)] hover:underline">{t("buyerProtection.openAccount")}</Link>{" "}
          {t("buyerProtection.or")} {" "}
          <Link href="/contact" className="text-[var(--gold)] hover:underline">{t("buyerProtection.contactTeam")}</Link>.
        </p>
      </div>
    </section>
  );
}
