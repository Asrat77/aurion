"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  Compass,
  Handshake,
  Package,
  ShoppingBagOpen,
} from "@phosphor-icons/react/ssr";
import { DEPLOYMENT } from "@/lib/channel";

const ORIGINS = [
  {
    index: "01",
    title: "home.coffee",
    subtitle: "home.coffeeSubtitle",
    href: "/store?category=coffee",
  },
  {
    index: "02",
    title: "home.grains",
    subtitle: "home.grainsSubtitle",
    href: "/store?category=teff",
  },
  {
    index: "03",
    title: "home.spices",
    subtitle: "home.spicesSubtitle",
    href: "/store?category=spices",
  },
  {
    index: "04",
    title: "home.jewelry",
    subtitle: "home.jewelrySubtitle",
    href: "/store?category=jewelry",
  },
];

const SOURCE_STEPS = [
  {
    icon: Compass,
    number: "01",
    title: "home.step1Title",
    body: "home.step1Body",
  },
  {
    icon: Handshake,
    number: "02",
    title: "home.step2Title",
    body: "home.step2Body",
  },
  {
    icon: Package,
    number: "03",
    title: "home.step3Title",
    body: "home.step3Body",
  },
];

export default function Home() {
  const { t } = useTranslation();
  // A dedicated Business site rewrites "/" into the /business tree, so the
  // only non-Express root left to handle here is Operations.
  if (DEPLOYMENT === "operations") return <OperationsHome />;
  return (
    <>
      <section className="aurion-hero relative min-h-[100svh] overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        <div className="absolute inset-0 aurion-pattern opacity-[0.22]" />
        <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-[var(--blue-glow)] blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[440px] w-[440px] rounded-full bg-[rgba(214,180,94,0.09)] blur-[140px]" />

        <div className="relative mx-auto grid min-h-[calc(100svh-9rem)] max-w-[var(--container-wide)] items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-[760px]">
            <p className="section-label hero-reveal hero-reveal-1">{t("home.eyebrow")}</p>
            <h1 className="display-hero hero-reveal hero-reveal-2 mb-7 max-w-[760px]">
              {t("home.heroShop")} <span className="text-[var(--gold)] italic">{t("home.heroOrigin")}</span>
              <br />
              {t("home.heroSource")} <span className="text-[var(--gold)] italic">{t("home.heroScale")}</span>
            </h1>
            <p className="hero-reveal hero-reveal-3 max-w-[650px] text-base leading-[1.9] text-[var(--text-secondary)] sm:text-lg">
              {t("home.heroBody")}
            </p>

            <div className="hero-reveal hero-reveal-4 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/store" className="btn btn-primary group inline-flex items-center justify-center gap-2">
                {t("home.shopOrigin")}
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/source" className="btn btn-outline group inline-flex items-center justify-center gap-2">
                {t("home.sourceScale")}
                <ArrowUpRight size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="hero-reveal hero-reveal-5 mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.08] pt-5 font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <span>{t("home.retailMarketplace")}</span>
              <span>{t("home.commercialSourcing")}</span>
              <span>{t("home.directInquiry")}</span>
            </div>
          </div>

          <div className="hero-reveal hero-reveal-3 relative mx-auto flex w-full max-w-[590px] items-center justify-center lg:justify-end">
            <div className="emblem-stage relative aspect-square w-[min(86vw,560px)]">
              <div className="emblem-orbit emblem-orbit-outer" aria-hidden="true" />
              <div className="emblem-orbit emblem-orbit-inner" aria-hidden="true" />
              <div className="emblem-orbit-runner" aria-hidden="true">
                <span />
              </div>

              <div
                data-emblem-label
                className="emblem-side-label emblem-side-label-left"
                aria-hidden="true"
              >
                {t("home.commerceEngine")}
              </div>
              <div
                data-emblem-label
                className="emblem-side-label emblem-side-label-right"
                aria-hidden="true"
              >
                {t("home.addisToWorld")}
              </div>

              <div data-emblem-mark className="emblem-mark absolute inset-[17%] z-10">
                <Image
                  src="/brand/aurion-emblem.png"
                  alt={t("home.emblemAlt")}
                  fill
                  priority
                  sizes="(max-width: 1024px) 68vw, 370px"
                  className="object-contain drop-shadow-[0_28px_80px_rgba(214,180,94,0.22)]"
                />
              </div>

              <span className="emblem-glint emblem-glint-left" aria-hidden="true" />
              <span className="emblem-glint emblem-glint-center" aria-hidden="true" />
              <span className="emblem-glint emblem-glint-right" aria-hidden="true" />

              <div className="absolute bottom-[5%] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border-gold)] bg-[rgba(5,7,13,0.88)] px-4 py-2 backdrop-blur-xl font-[family-name:var(--font-mono)] text-[0.58rem] tracking-[0.2em] text-[var(--gold-light)] shadow-[0_12px_38px_rgba(0,0,0,0.35)]">
                {t("home.fromEthiopia")}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-[family-name:var(--font-mono)] text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-muted)] lg:flex">
          <span className="h-px w-12 bg-[var(--border-gold)]" />
          {t("home.discover")}
          <span className="h-px w-12 bg-[var(--border-gold)]" />
        </div>
      </section>

      <div className="brand-rail border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4">
        <div className="mx-auto flex max-w-[var(--container-wide)] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">
          <span>AURION GLOBAL HOLDINGS PLC</span>
          <span className="text-[var(--gold)]">◆</span>
          <span>{t("home.commerceEngine")}</span>
          <span className="text-[var(--gold)]">◆</span>
          <span>{t("home.addisToWorld")}</span>
        </div>
      </div>

      <section id="story" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 aurion-pattern opacity-[0.08]" />
        <div className="relative mx-auto max-w-[var(--container-wide)]">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="section-label">{t("home.storyEyebrow")}</p>
              <h2 className="display-title max-w-[540px]">
                {t("home.storyTitleA")}
                <br />
                {t("home.storyTitleB")}
              </h2>
            </div>
            <p className="max-w-[660px] text-base leading-[1.9] text-[var(--text-secondary)] lg:justify-self-end lg:text-lg">
              {t("home.storyBody")}
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <Link href="/store" className="experience-card group relative min-h-[390px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] p-8 sm:p-10">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[rgba(214,180,94,0.1)] opacity-70 blur-[80px] transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <ShoppingBagOpen size={34} className="text-[var(--gold)]" />
                <div className="mt-auto">
                  <span className="font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.22em] text-[var(--gold)]">{t("home.forIndividuals")}</span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-white sm:text-5xl">{t("home.shopOriginTitle")}</h3>
                  <p className="mt-4 max-w-[500px] leading-relaxed text-[var(--text-secondary)]">{t("home.shopOriginBody")}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)]">
                    {t("home.enterMarketplace")} <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/source" className="experience-card experience-card-blue group relative min-h-[390px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] p-8 sm:p-10">
              <div className="absolute inset-0 aurion-pattern opacity-[0.16]" />
              <div className="relative flex h-full flex-col">
                <Buildings size={34} className="text-[var(--gold)]" />
                <div className="mt-auto">
                  <span className="font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.22em] text-[var(--gold)]">{t("home.forBusinesses")}</span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-white sm:text-5xl">{t("home.sourceScaleTitle")}</h3>
                  <p className="mt-4 max-w-[500px] leading-relaxed text-[var(--text-secondary)]">{t("home.sourceScaleBody")}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)]">
                    {t("home.openDesk")} <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--container-wide)]">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-label">{t("home.originsEyebrow")}</p>
              <h2 className="display-title">{t("home.originsTitle")}</h2>
            </div>
            <Link href="/store" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold)] hover:text-white">
              {t("home.viewMarketplace")} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
            {ORIGINS.map((origin) => (
              <Link key={origin.index} href={origin.href} className="origin-card group relative min-h-[290px] overflow-hidden bg-[var(--bg-card)] p-7">
                <span className="font-[family-name:var(--font-mono)] text-[0.6rem] tracking-[0.2em] text-[var(--gold)]">{origin.index}</span>
                <span className="absolute -bottom-10 -right-2 font-[family-name:var(--font-display)] text-[10rem] leading-none text-white/[0.025] transition-transform duration-500 group-hover:-translate-y-3">
                  {origin.index}
                </span>
                <div className="absolute inset-x-7 bottom-7">
                  <h3 className="font-[family-name:var(--font-display)] text-3xl text-white">{t(origin.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{t(origin.subtitle)}</p>
                  <ArrowUpRight size={18} className="mt-5 text-[var(--gold)] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[var(--blue-glow)] blur-[150px]" />
        <div className="relative mx-auto max-w-[var(--container-wide)]">
          <div className="grid gap-14 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="section-label">{t("home.deskEyebrow")}</p>
              <h2 className="display-title max-w-[520px]">{t("home.deskTitle")}</h2>
              <p className="mt-6 max-w-[520px] leading-[1.9] text-[var(--text-secondary)]">{t("home.deskBody")}</p>
              <Link href="/source" className="btn btn-primary mt-8 inline-flex items-center gap-2">
                {t("home.startRequest")} <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {SOURCE_STEPS.map((step) => (
                <div key={step.number} className="group grid gap-5 py-8 sm:grid-cols-[70px_1fr_44px] sm:items-start sm:py-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-gold)] text-[var(--gold)]">
                    <step.icon size={22} />
                  </div>
                  <div>
                    <span className="font-[family-name:var(--font-mono)] text-[0.58rem] tracking-[0.2em] text-[var(--gold)]">{t("home.stepLabel", { number: step.number })}</span>
                    <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-white sm:text-3xl">{t(step.title)}</h3>
                    <p className="mt-3 max-w-[620px] leading-relaxed text-[var(--text-secondary)]">{t(step.body)}</p>
                  </div>
                  <ArrowRight size={20} className="hidden text-[var(--border-gold-strong)] transition-transform group-hover:translate-x-1 sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <div className="relative mx-auto overflow-hidden rounded-[32px] border border-[var(--border-gold)] bg-[var(--bg-card)] px-7 py-14 sm:px-12 lg:px-16 lg:py-20 max-w-[var(--container-wide)]">
          <div className="absolute inset-0 aurion-pattern opacity-[0.16]" />
          <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full bg-[rgba(214,180,94,0.1)] blur-[100px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="section-label">{t("home.closingEyebrow")}</p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                {t("home.closingTitle")}
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/store" className="btn btn-primary inline-flex items-center justify-center gap-2">
                {t("home.exploreProducts")} <ArrowRight size={17} />
              </Link>
              <Link href="/source" className="btn btn-outline inline-flex items-center justify-center gap-2">
                {t("home.requestQuote")} <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function OperationsHome() {
  return (
    <section className="relative min-h-[75svh] overflow-hidden px-4 pb-24 pt-40 sm:px-6 lg:px-8">
      <div className="absolute inset-0 aurion-pattern opacity-[0.15]" />
      <div className="relative mx-auto max-w-[var(--container-wide)]">
        <p className="section-label">AURION OPERATIONS</p>
        <h1 className="display-title mt-4 max-w-[760px]">The control room for sourcing, fulfilment, and protection.</h1>
        <p className="mt-6 max-w-[620px] text-lg leading-relaxed text-[var(--text-secondary)]">Operations access is role-protected by the Rails API. Use the appropriate workspace below.</p>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/admin" className="btn btn-primary">Admin workspace</Link><Link href="/vendor" className="btn btn-outline">Supplier workspace</Link></div>
      </div>
    </section>
  );
}
