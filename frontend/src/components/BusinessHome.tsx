"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, ClipboardText, Handshake, ShieldCheck } from "@phosphor-icons/react/ssr";
import { channelUrl } from "@/lib/channel";

const STEPS = [
  { icon: ClipboardText, number: "01", title: "Describe the requirement", body: "Send one structured request with products, quantities, destination, terms, and inspection requirements." },
  { icon: Handshake, number: "02", title: "Compare verified offers", body: "Eligible suppliers receive the opportunity, then you compare their commercial terms and revisions in one workspace." },
  { icon: ShieldCheck, number: "03", title: "Trade with a protected record", body: "Accept the exact contract, track evidence and shipment, and resolve release or dispute decisions against an auditable trade record." },
];

export default function BusinessHome() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative min-h-[78svh] px-4 pb-20 pt-36 sm:px-6 lg:px-8 lg:pt-44">
        <div className="absolute inset-0 aurion-pattern opacity-[0.18]" />
        <div className="absolute -right-32 top-16 h-[520px] w-[520px] rounded-full bg-[var(--blue-glow)] blur-[150px]" />
        <div className="relative mx-auto grid max-w-[var(--container-wide)] items-center gap-14 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-[720px]">
            <p className="section-label">AURION BUSINESS / SOURCING DESK</p>
            <h1 className="display-hero mt-4 max-w-[780px]">Source with clarity. <span className="text-[var(--gold)] italic">Trade with control.</span></h1>
            <p className="mt-7 max-w-[650px] text-base leading-[1.9] text-[var(--text-secondary)] sm:text-lg">
              A structured commercial marketplace for Ethiopian-origin goods, from the first requirement to supplier selection, contract acceptance, inspection, shipment, and resolution.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/workspace" className="btn btn-primary inline-flex items-center justify-center gap-2">Start an RFQ <ArrowRight size={17} /></Link>
              <Link href="/catalogue" className="btn btn-outline inline-flex items-center justify-center gap-2">Browse wholesale catalogue <ArrowRight size={17} /></Link>
              <Link href={channelUrl("express", "/store")} className="btn btn-outline inline-flex items-center justify-center gap-2">Browse Express <ArrowRight size={17} /></Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.08] pt-5 font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <span>Structured RFQs</span><span>Competing offers</span><span>Protected trade records</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="rounded-[30px] border border-[var(--border-gold)] bg-[rgba(9,13,22,0.82)] p-6 shadow-[0_35px_110px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8">
              <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-6">
                <div><p className="section-label">TRADE WORKSPACE</p><h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">One accountable thread</h2></div>
                <span className="rounded-full border border-[rgba(88,203,137,0.35)] bg-[rgba(88,203,137,0.1)] px-3 py-1 font-[family-name:var(--font-mono)] text-[0.58rem] uppercase tracking-[0.16em] text-[#8de1aa]">Traceable</span>
              </div>
              <div className="space-y-5 pt-6">
                {["Requirement received", "Supplier offers compared", "Contract terms accepted", "Delivery evidence reviewed"].map((label) => (
                  <div key={label} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"><CheckCircle size={20} className="text-[var(--gold)]" weight="fill" />{label}</div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-relaxed text-[var(--text-muted)]">Protection language and provider status stay visible. No claim is shown until the underlying condition is recorded.</div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--container-wide)]"><p className="section-label">THE AURION BUSINESS FLOW</p><h2 className="display-title mt-3 max-w-[680px]">Commercial sourcing, without the blind spots.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--border-subtle)] lg:grid-cols-3">
            {STEPS.map(({ icon: Icon, number, title, body }) => <article key={number} className="bg-[var(--bg-card)] p-7 sm:p-9"><div className="flex items-center justify-between"><Icon size={30} className="text-[var(--gold)]" /><span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-[var(--gold)]">{number}</span></div><h3 className="mt-14 font-[family-name:var(--font-display)] text-3xl text-white">{title}</h3><p className="mt-4 leading-relaxed text-[var(--text-secondary)]">{body}</p></article>)}
          </div>
        </div>
      </section>
    </div>
  );
}
