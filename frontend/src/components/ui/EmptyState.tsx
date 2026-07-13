import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full border border-[var(--border-gold)] bg-[rgba(200,164,92,0.06)] text-[var(--gold)] mb-5">
        {icon}
      </div>
      <h3 className="display-heading mb-2">{title}</h3>
      {body && (
        <p className="text-sm text-[var(--text-muted)] max-w-[380px] mb-5">
          {body}
        </p>
      )}
      {action}
    </div>
  );
}
