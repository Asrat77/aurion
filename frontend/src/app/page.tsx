import Link from "next/link";
import Image from "next/image";
import { Diamond, Brain, ArrowRight } from "@phosphor-icons/react/ssr";
import ProductImage from "@/components/ui/ProductImage";

export default function Home() {
  return (
    <>
      <section className="relative min-h-[100dvh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1573883841850-49e42245e193?w=1920&h=1080&fit=crop&auto=format&q=75"
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-deep)] via-[var(--bg-deep)]/40 to-[var(--bg-deep)]" />
        </div>
        <div className="relative z-10 max-w-[var(--container-content)] mx-auto">
          <p className="section-label">Addis Ababa to Global Markets</p>
          <h1 className="display-hero mb-6">
            Integrated <span className="text-[var(--gold)] italic">Engines</span>{" "}
            of Technology, Commerce &amp;{" "}
            <span className="text-[var(--gold)] italic inline-block pb-1">Industry</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto mb-10 leading-loose font-light">
            An Ethiopian-origin conglomerate building integrated engines of value across
            technology, commerce, and industry.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/store" className="btn btn-primary">
              Explore Store
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Investor Relations
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-surface)]">
        <div className="max-w-[var(--container-wide)] mx-auto">
          <h2 className="display-title mb-1">Core Engines of Value</h2>
          <div className="divider" />
          <p className="section-desc">
            AURION is built as a three-engine growth system: cash flow, high-margin
            industry, and intellectual property. Each reinforces the others.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6">
            <Link
              href="/store"
              className="lg:col-span-2 lg:row-span-2 relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] min-h-[320px] group transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] hover:border-[var(--border-gold)] hover:shadow-[var(--shadow-gold)]"
            >
              <ProductImage
                name="AURION Markets"
                emoji="📈"
                photoId="1769628702933-39ba968cb198"
                width={1200}
                height={900}
                sizes="(max-width: 1024px) 100vw, 66vw"
                frame={false}
                className="absolute inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="text-xs text-[var(--gold)] uppercase tracking-wide font-semibold">
                  Cash Flow Engine
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-3xl text-white mt-1 mb-2">
                  AURION MARKETS
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-[440px] mb-3">
                  Global Ethiopian marketplace for coffee, teff, spices, and cultural goods,
                  generating sustainable cash flow.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[var(--gold)] font-semibold text-sm uppercase tracking-wide">
                  Shop Now <ArrowRight size={14} />
                </span>
              </div>
            </Link>

            <div className="card flex flex-col">
              <Diamond size={28} className="text-[var(--gold)] mb-4" />
              <span className="text-xs text-[var(--gold)] uppercase tracking-wide font-semibold">
                High-Margin Industrial
              </span>
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-white mb-2 mt-1">
                AURION JEWELS
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed flex-1">
                Transforming precious resources into world-class products through precision
                manufacturing and innovation.
              </p>
              <Link
                href="/store?category=jewelry"
                className="inline-flex items-center gap-1.5 mt-4 text-[var(--gold)] font-semibold text-sm uppercase tracking-wide hover:underline"
              >
                View Collection <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card flex flex-col">
              <Brain size={28} className="text-[var(--gold)] mb-4" />
              <span className="text-xs text-[var(--gold)] uppercase tracking-wide font-semibold">
                Intellectual Property
              </span>
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-white mb-2 mt-1">
                AURION LABS
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed flex-1">
                Patentable technology products: emergency detection systems, agricultural IoT
                sensors, and industrial monitoring, designed in Ethiopia and licensed globally.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[var(--container-wide)] mx-auto">
          <h2 className="display-title mb-1">Future Divisions</h2>
          <div className="divider" />
          <p className="section-desc">
            After marketplace and jewelry scale, AURION will enter capital-intensive
            infrastructure: energy and mining, unlocking Ethiopia&apos;s vast natural resources.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-8">
                <span className="inline-block bg-[rgba(200,164,92,0.15)] text-[var(--gold)] px-3.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                  Coming Soon
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-3xl text-white mt-2 mb-1">
                  AURION POWER
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Harnessing clean energy to power industries and empower communities. Solar
                  farms in Afar Region with molten salt CSP storage, 300MW+ capacity.
                </p>
              </div>
              <div>
                <span className="inline-block bg-[rgba(200,164,92,0.15)] text-[var(--gold)] px-3.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                  Coming Soon
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-3xl text-white mt-2 mb-1">
                  AURION RESOURCES
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Unlocking and responsibly developing natural resources for lasting value.
                  Gold refining, copper processing, and gemstone export, capturing value
                  locally.
                </p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] aspect-[3/2]">
              <ProductImage
                name="AURION Power and Resources"
                emoji="⚡"
                photoId="1545209575-704d1434f9cd"
                width={1200}
                height={800}
                sizes="(max-width: 1024px) 100vw, 50vw"
                frame={false}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
