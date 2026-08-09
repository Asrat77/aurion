"use client";

import Link from "next/link";
import { CheckCircle, Gavel, MagnifyingGlass, SealCheck, ShieldCheck } from "@phosphor-icons/react";
import { useNetworkSnapshot } from "@/lib/businessNetwork";
import { businessHref } from "@/lib/channel";
import ProtectionNotice from "@/components/business/ProtectionNotice";

const MILESTONES = [
  {
    title: "Funding",
    body: "After both parties accept the contract digest, the buyer funds the trade with the payment provider. AURION never holds the money itself.",
  },
  {
    title: "Inspection",
    body: "If the requirement asked for pre-shipment inspection, the supplier uploads evidence and an administrator passes, fails or waives it. A failed inspection blocks shipment and release.",
  },
  {
    title: "Shipment and delivery",
    body: "The supplier records the carrier and tracking documents. An administrator verifies the delivery evidence before the release clock starts.",
  },
  {
    title: "Release",
    body: "Funds release on buyer acceptance, or automatically seven calendar days after verified delivery when no dispute is open.",
  },
  {
    title: "Dispute",
    body: "A buyer can dispute from confirmed funding until release. An open dispute freezes release; resolution allocates the held amount between refund and release, never exceeding what was funded.",
  },
];

export default function AssurancePage() {
  const network = useNetworkSnapshot();

  return (
    <section className="mx-auto max-w-[var(--container-content)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="border-b border-[var(--b-line)] pb-7">
        <p className="b-eyebrow">Protected Trade</p>
        <h1 className="display-title mt-2">How AURION protects a commercial order</h1>
        <p className="mt-3 max-w-[620px] text-[0.92rem] leading-[1.7] text-[var(--text-secondary)]">
          Protected Trade is a milestone-controlled payment workflow. Every state change is driven by a recorded event
          rather than a button, and every financial movement is append-only.
        </p>
      </div>

      <div className="mt-6">
        <ProtectionNotice protection={network.data?.protection} />
      </div>

      <div className="mt-10">
        <h2 className="display-title" id="milestones">
          The protected lifecycle
        </h2>
        <ol className="mt-5 space-y-3">
          {MILESTONES.map((milestone, index) => (
            <li key={milestone.title} className="b-panel flex gap-4 p-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--b-navy)] font-[family-name:var(--font-mono)] text-[0.72rem] text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-[0.98rem] font-semibold text-[var(--text-primary)]">{milestone.title}</h3>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">{milestone.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10" id="matching">
        <h2 className="display-title">How supplier matching works</h2>
        <p className="mt-3 max-w-[620px] text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
          Matching is deterministic and published. A supplier must be active, approved, enabled for Business, and hold
          an administrator-verified capability covering the category, destination and quantity. Eligible suppliers are
          then scored out of 100 and the top five are invited.
        </p>
        <div className="b-panel mt-5 overflow-x-auto">
          <table className="data-table min-w-[420px]">
            <thead>
              <tr>
                <th>Criterion</th>
                <th className="num">Maximum points</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Exact product or category fit</td>
                <td className="num">40</td>
              </tr>
              <tr>
                <td>Destination coverage</td>
                <td className="num">20</td>
              </tr>
              <tr>
                <td>Quantity and MOQ fit</td>
                <td className="num">15</td>
              </tr>
              <tr>
                <td>Requested lead time fit</td>
                <td className="num">15</td>
              </tr>
              <tr>
                <td>Supplier verification</td>
                <td className="num">10</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[0.82rem] leading-relaxed text-[var(--text-secondary)]">
          <MagnifyingGlass size={15} className="mt-0.5 shrink-0 text-[var(--b-navy)]" />
          Every buyer can open the match console on their own requirement and see each supplier&apos;s points criterion
          by criterion, including who was ruled out and why. Fewer than three eligible matches escalates to Operations.
        </p>
      </div>

      <div className="mt-10" id="verification">
        <h2 className="display-title">What verification actually means</h2>
        <ul className="mt-5 space-y-2.5">
          {[
            "A supplier organization is marked verified only by an administrator, against its registration details.",
            "Certifications and served regions are supplier-declared and only shown once the capability holding them is verified.",
            "An unverified supplier is displayed as unverified. The directory never upgrades a claim into a badge.",
            "Track record figures come from the trade tables: invitations received, quotations submitted, trades settled.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
              <SealCheck size={15} weight="fill" className="mt-0.5 shrink-0 text-[var(--b-verified)]" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10" id="disputes">
        <h2 className="display-title">Disputes and refunds</h2>
        <ul className="mt-5 space-y-2.5">
          {[
            "A dispute can be raised from confirmed funding until release, and freezes any scheduled release immediately.",
            "Both parties attach evidence to the dispute record; nothing is deleted or edited afterwards.",
            "An administrator resolves it by allocating the held amount to supplier release, buyer refund, or both.",
            "The allocation can never exceed the funded amount, and a resolution cannot be applied twice.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
              <Gavel size={15} className="mt-0.5 shrink-0 text-[var(--b-navy)]" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="b-panel mt-10 p-6">
        <h2 className="flex items-center gap-2 text-[1.02rem] font-semibold text-[var(--text-primary)]">
          <ShieldCheck size={18} className="text-[var(--b-navy)]" /> What we do not claim
        </h2>
        <ul className="mt-3.5 space-y-2">
          {[
            "AURION is not a bank and does not custody funds. Protection is provided by the connected payment provider.",
            "No guarantee, insurance or escrow is advertised on a deployment where a provider is not connected.",
            "Sandbox funding is available outside production only and is labelled as such wherever it appears.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[0.85rem] leading-relaxed text-[var(--text-secondary)]">
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link href={businessHref("/rfqs")} className="btn btn-primary">
          Post a requirement
        </Link>
        <Link href={businessHref("/suppliers")} className="btn btn-outline">
          Browse verified suppliers
        </Link>
      </div>
    </section>
  );
}
