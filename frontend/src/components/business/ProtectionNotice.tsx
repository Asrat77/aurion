"use client";

import { ShieldCheck, ShieldWarning } from "@phosphor-icons/react";
import type { NetworkSnapshot } from "@/lib/businessNetwork";

/**
 * The single place Protected Trade is described to a buyer. The wording comes
 * from the backend's own view of which provider adapter is registered, so the
 * storefront cannot promise protection the deployment cannot perform.
 */
export default function ProtectionNotice({ protection }: { protection?: NetworkSnapshot["protection"] }) {
  const mode = protection?.mode ?? "disabled";
  const live = mode === "live";

  return (
    <div
      className={`b-panel p-5 ${live ? "border-[rgba(18,115,77,0.35)] bg-[var(--b-verified-tint)]" : "border-[rgba(138,90,0,0.3)] bg-[var(--b-pending-tint)]"}`}
    >
      <div className="flex items-start gap-3">
        <span className={live ? "text-[var(--b-verified)]" : "text-[var(--b-pending)]"}>
          {live ? <ShieldCheck size={20} weight="fill" /> : <ShieldWarning size={20} weight="fill" />}
        </span>
        <div>
          <p className="text-[0.9rem] font-semibold text-[var(--text-primary)]">AURION Protected Trade</p>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--text-secondary)]">
            {protection?.label ??
              "Protected Trade is not activated yet. A licensed payment provider must be connected first."}
          </p>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Provider mode: {mode}
          </p>
        </div>
      </div>
    </div>
  );
}
