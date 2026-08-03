import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  Compass,
  Handshake,
  Package,
  ShoppingBagOpen,
} from "@phosphor-icons/react/ssr";

const ORIGINS = [
  {
    index: "01",
    title: "Coffee",
    subtitle: "Yirgacheffe and Sidamo",
    href: "/store?category=coffee",
  },
  {
    index: "02",
    title: "Teff & Grains",
    subtitle: "Everyday staples, Ethiopian origin",
    href: "/store?category=teff",
  },
  {
    index: "03",
    title: "Spices & Honey",
    subtitle: "Bold flavor, unmistakable place",
    href: "/store?category=spices",
  },
  {
    index: "04",
    title: "Jewelry & Craft",
    subtitle: "Made with material and memory",
    href: "/store?category=jewelry",
  },
];

const SOURCE_STEPS = [
  {
    icon: Compass,
    number: "01",
    title: "Share the requirement",
    body: "Tell us the product, destination, quantity, packaging needs, and commercial context.",
  },
  {
    icon: Handshake,
    number: "02",
    title: "Start a direct conversation",
    body: "Your request enters the AURION sourcing desk with a trackable reference.",
  },
  {
    icon: Package,
    number: "03",
    title: "Shape the right route",
    body: "Move from product interest toward a practical sourcing conversation without guesswork.",
  },
];

export default function Home() {
  return (
    <>
      <section className="aurion-hero relative min-h-[100svh] overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        <div className="absolute inset-0 aurion-pattern opacity-[0.22]" />
        <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-[var(--blue-glow)] blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[440px] w-[440px] rounded-full bg-[rgba(214,180,94,0.09)] blur-[140px]" />

        <div className="relative mx-auto grid min-h-[calc(100svh-9rem)] max-w-[var(--container-wide)] items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-[760px]">
            <p className="section-label hero-reveal hero-reveal-1">Ethiopian origin, global reach</p>
            <h1 className="display-hero hero-reveal hero-reveal-2 mb-7 max-w-[760px]">
              Shop the <span className="text-[var(--gold)] italic">origin.</span>
              <br />
              Source the <span className="text-[var(--gold)] italic">scale.</span>
            </h1>
            <p className="hero-reveal hero-reveal-3 max-w-[650px] text-base leading-[1.9] text-[var(--text-secondary)] sm:text-lg">
              AURION Markets connects Ethiopian products with people who want a single piece
              and businesses looking for commercial quantities.
            </p>

            <div className="hero-reveal hero-reveal-4 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/store" className="btn btn-primary group inline-flex items-center justify-center gap-2">
                Shop the origin
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/source" className="btn btn-outline group inline-flex items-center justify-center gap-2">
                Source at scale
                <ArrowUpRight size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="hero-reveal hero-reveal-5 mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.08] pt-5 font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <span>Retail marketplace</span>
              <span>Commercial sourcing</span>
              <span>Direct inquiry</span>
            </div>
          </div>

          <div className="hero-reveal hero-reveal-3 relative mx-auto flex w-full max-w-[590px] items-center justify-center lg:justify-end">
            <div className="emblem-stage relative aspect-square w-[min(86vw,560px)]">
              <div className="absolute inset-[8%] rounded-full border border-[rgba(214,180,94,0.16)]" />
              <div className="absolute inset-[17%] rounded-full border border-dashed border-[rgba(214,180,94,0.14)]" />
              <div className="absolute left-[4%] top-1/2 -translate-y-1/2 -rotate-90 font-[family-name:var(--font-mono)] text-[0.56rem] tracking-[0.32em] text-[var(--gold)]">
                AURION MARKETS
              </div>
              <div className="absolute right-[2%] top-1/2 -translate-y-1/2 rotate-90 font-[family-name:var(--font-mono)] text-[0.56rem] tracking-[0.32em] text-[var(--text-muted)]">
                ETHIOPIA / GLOBAL
              </div>
              <Image
                src="/brand/aurion-emblem.png"
                alt="AURION blue and gold emblem"
                fill
                priority
                sizes="(max-width: 1024px) 86vw, 560px"
                className="object-contain p-[13%] drop-shadow-[0_28px_80px_rgba(214,180,94,0.22)]"
              />
              <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border-gold)] bg-[rgba(5,7,13,0.8)] px-4 py-2 backdrop-blur-xl font-[family-name:var(--font-mono)] text-[0.58rem] tracking-[0.2em] text-[var(--gold-light)]">
                FROM ETHIOPIA TO THE WORLD
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-[family-name:var(--font-mono)] text-[0.55rem] uppercase tracking-[0.22em] text-[var(--text-muted)] lg:flex">
          <span className="h-px w-12 bg-[var(--border-gold)]" />
          Discover AURION
          <span className="h-px w-12 bg-[var(--border-gold)]" />
        </div>
      </section>

      <div className="brand-rail border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4">
        <div className="mx-auto flex max-w-[var(--container-wide)] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">
          <span>AURION GLOBAL HOLDINGS PLC</span>
          <span className="text-[var(--gold)]">◆</span>
          <span>Commerce engine</span>
          <span className="text-[var(--gold)]">◆</span>
          <span>Addis Ababa to global markets</span>
        </div>
      </div>

      <section id="story" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 aurion-pattern opacity-[0.08]" />
        <div className="relative mx-auto max-w-[var(--container-wide)]">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="section-label">One market, two ways in</p>
              <h2 className="display-title max-w-[540px]">
                The same origin.
                <br />
                A different scale.
              </h2>
            </div>
            <p className="max-w-[660px] text-base leading-[1.9] text-[var(--text-secondary)] lg:justify-self-end lg:text-lg">
              AURION Markets brings retail discovery and commercial sourcing into one clear
              experience. Browse products for yourself, or tell us what your business needs.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <Link href="/store" className="experience-card group relative min-h-[390px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] p-8 sm:p-10">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[rgba(214,180,94,0.1)] opacity-70 blur-[80px] transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <ShoppingBagOpen size={34} className="text-[var(--gold)]" />
                <div className="mt-auto">
                  <span className="font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.22em] text-[var(--gold)]">For individuals</span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-white sm:text-5xl">Shop the Origin</h3>
                  <p className="mt-4 max-w-[500px] leading-relaxed text-[var(--text-secondary)]">
                    Explore coffee, grains, spices, honey, textiles, jewelry, and more from
                    Ethiopian vendors.
                  </p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)]">
                    Enter the marketplace <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/source" className="experience-card experience-card-blue group relative min-h-[390px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] p-8 sm:p-10">
              <div className="absolute inset-0 aurion-pattern opacity-[0.16]" />
              <div className="relative flex h-full flex-col">
                <Buildings size={34} className="text-[var(--gold)]" />
                <div className="mt-auto">
                  <span className="font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.22em] text-[var(--gold)]">For businesses</span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-white sm:text-5xl">Source at Scale</h3>
                  <p className="mt-4 max-w-[500px] leading-relaxed text-[var(--text-secondary)]">
                    Share your destination, quantity, packaging, and product requirements in
                    one focused sourcing request.
                  </p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-light)]">
                    Open the sourcing desk <ArrowUpRight size={16} />
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
              <p className="section-label">Explore by origin</p>
              <h2 className="display-title">Find your way in.</h2>
            </div>
            <Link href="/store" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold)] hover:text-white">
              View the full marketplace <ArrowRight size={16} />
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
                  <h3 className="font-[family-name:var(--font-display)] text-3xl text-white">{origin.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{origin.subtitle}</p>
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
              <p className="section-label">The sourcing desk</p>
              <h2 className="display-title max-w-[520px]">Commercial interest, made concrete.</h2>
              <p className="mt-6 max-w-[520px] leading-[1.9] text-[var(--text-secondary)]">
                Replace scattered messages with one structured request and a reference you can
                use in every follow-up.
              </p>
              <Link href="/source" className="btn btn-primary mt-8 inline-flex items-center gap-2">
                Start a request <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {SOURCE_STEPS.map((step) => (
                <div key={step.number} className="group grid gap-5 py-8 sm:grid-cols-[70px_1fr_44px] sm:items-start sm:py-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-gold)] text-[var(--gold)]">
                    <step.icon size={22} />
                  </div>
                  <div>
                    <span className="font-[family-name:var(--font-mono)] text-[0.58rem] tracking-[0.2em] text-[var(--gold)]">STEP {step.number}</span>
                    <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-white sm:text-3xl">{step.title}</h3>
                    <p className="mt-3 max-w-[620px] leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
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
              <p className="section-label">AURION Markets</p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                Your next Ethiopian product starts here.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/store" className="btn btn-primary inline-flex items-center justify-center gap-2">
                Explore products <ArrowRight size={17} />
              </Link>
              <Link href="/source" className="btn btn-outline inline-flex items-center justify-center gap-2">
                Request a quote <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
