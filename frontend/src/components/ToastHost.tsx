"use client";

import { useEffect, useState } from "react";
import { CheckCircle, WarningCircle, Info } from "@phosphor-icons/react";
import { useUiStore, type Toast } from "@/store/ui";

const colors: Record<string, string> = {
  info: "border-[var(--gold)] text-[var(--gold)]",
  success: "border-[var(--success)] text-[var(--success)]",
  error: "border-[var(--danger)] text-[var(--danger)]",
};

const icons: Record<string, React.ReactNode> = {
  info: <Info size={18} weight="fill" />,
  success: <CheckCircle size={18} weight="fill" />,
  error: <WarningCircle size={18} weight="fill" />,
};

export default function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <div className="fixed top-[90px] right-5 z-[10000] flex flex-col gap-2 max-w-[400px]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  // Transition-based mount: enter from the right edge (where the stack lives)
  // + fade. Because it's a CSS transition, a toast whose position shifts as the
  // stack grows retargets from its current spot instead of restarting.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`flex items-center gap-2.5 bg-[var(--bg-elevated)] border ${colors[toast.type]} px-5 py-3.5 rounded-lg text-sm font-medium shadow-2xl transition-[transform,opacity] duration-200 ease-[var(--ease-out)] ${
        mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      }`}
    >
      {icons[toast.type]}
      {toast.message}
    </div>
  );
}
