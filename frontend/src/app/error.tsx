"use client";

import { WarningCircle } from "@phosphor-icons/react";
import EmptyState from "@/components/ui/EmptyState";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-h-[100dvh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <EmptyState
        icon={<WarningCircle size={32} />}
        title="Something went wrong"
        body="An unexpected error occurred. You can try again."
        action={
          <button className="btn btn-primary" onClick={reset}>
            Retry
          </button>
        }
      />
    </section>
  );
}
