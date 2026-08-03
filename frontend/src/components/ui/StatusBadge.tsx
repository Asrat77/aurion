const STATUS_STYLES: Record<string, string> = {
  // order/payment states
  pending: "text-[var(--warning)] bg-[rgba(255,193,7,0.12)]",
  paid: "text-[var(--success)] bg-[rgba(92,184,141,0.12)]",
  fulfilled: "text-[var(--success)] bg-[rgba(92,184,141,0.12)]",
  shipped: "text-[var(--gold)] bg-[rgba(200,164,92,0.12)]",
  delivered: "text-[var(--success)] bg-[rgba(92,184,141,0.12)]",
  cancelled: "text-[var(--danger)] bg-[rgba(224,85,85,0.12)]",
  refunded: "text-[var(--danger)] bg-[rgba(224,85,85,0.12)]",
  // vendor/product states
  active: "text-[var(--success)] bg-[rgba(92,184,141,0.12)]",
  draft: "text-[var(--text-secondary)] bg-[rgba(176,172,165,0.1)]",
  suspended: "text-[var(--danger)] bg-[rgba(224,85,85,0.12)]",
  // sourcing states
  new: "text-[var(--gold-light)] bg-[rgba(214,180,94,0.12)]",
  reviewing: "text-[#8ec5ff] bg-[rgba(67,145,220,0.12)]",
  quoted: "text-[var(--success)] bg-[rgba(92,184,141,0.12)]",
  closed: "text-[var(--text-secondary)] bg-[rgba(176,172,165,0.1)]",
};

function labelFor(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function StatusBadge({ status }: { status: string }) {
  const style =
    STATUS_STYLES[status.toLowerCase()] ??
    "text-[var(--text-secondary)] bg-[rgba(176,172,165,0.1)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border border-current/20 px-3 py-1 text-xs font-semibold tracking-wide ${style}`}
    >
      {labelFor(status)}
    </span>
  );
}
