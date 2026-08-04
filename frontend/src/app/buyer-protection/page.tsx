import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Package, ArrowsClockwise, Scales, Clock } from "@phosphor-icons/react/ssr";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Buyer Protection | AURION Markets",
  description:
    "Every AURION order is covered: if your goods never arrive, arrive damaged, or are not what was described, you can claim a refund.",
};

const COVERAGE = [
  {
    icon: Package,
    title: "It never arrived",
    body: "If a vendor has not delivered within the stated window, you can claim at any time — there is no deadline on goods you never received.",
  },
  {
    icon: ArrowsClockwise,
    title: "It arrived damaged",
    body: "Goods that reach you broken, spoiled or unusable are covered. Photographs help us resolve the claim quickly.",
  },
  {
    icon: Scales,
    title: "Not as described",
    body: "If what arrived differs materially from the listing — wrong grade, wrong weight, wrong item — the sale is not what you agreed to.",
  },
];

const STEPS = [
  "Open the order in your account and choose “Report a problem” on the item concerned.",
  "Tell us what went wrong and add any detail that helps.",
  "Our team reviews the claim alongside the vendor's fulfilment record.",
  "If we uphold it, the vendor's payout for that item is reversed and you are refunded.",
];

export default function BuyerProtectionPage() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-content)] mx-auto">
        <PageHeader
          title="Buyer Protection"
          description="Buying across borders should not mean carrying the risk alone."
        />

        <div className="flex items-start gap-4 rounded-2xl border border-[var(--border-gold)] bg-[var(--bg-surface)] p-6">
          <ShieldCheck size={28} weight="fill" className="text-[var(--gold)] shrink-0" />
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Every order placed through AURION Markets is covered. If your goods never arrive,
            arrive damaged, or are not what the listing described, you can raise a claim and we
            will put it right. Vendors are paid out only on sales that stand.
          </p>
        </div>

        <h2 className="display-heading mt-12 mb-5">What is covered</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COVERAGE.map((c) => (
            <article
              key={c.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-6"
            >
              <c.icon size={24} className="text-[var(--gold)]" />
              <h3 className="mt-3 text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{c.body}</p>
            </article>
          ))}
        </div>

        <h2 className="display-heading mt-12 mb-5">How a claim works</h2>
        <ol className="flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-gold)] font-mono text-sm text-[var(--gold)]">
                {i + 1}
              </span>
              <p className="pt-1 text-[var(--text-secondary)] leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deep)] p-6">
          <Clock size={24} className="text-[var(--gold)] shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-white">Claim window</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Once an item is marked delivered you have <strong>30 days</strong> to raise a claim.
              Items that have not been delivered can be claimed at any time. An order can be
              cancelled outright, without a claim, any time before the vendor hands it to a
              carrier.
            </p>
          </div>
        </div>

        <p className="mt-10 text-sm text-[var(--text-muted)]">
          Questions about a specific order?{" "}
          <Link href="/orders" className="text-[var(--gold)] hover:underline">
            Open it in your account
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="text-[var(--gold)] hover:underline">
            contact our team
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
