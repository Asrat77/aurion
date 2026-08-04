"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import EmptyState from "@/components/ui/EmptyState";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="min-h-[100dvh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <EmptyState
        icon={<WarningCircle size={32} />}
        title={t("common.somethingWentWrong")}
        body={t("errors.unexpected")}
        action={
          <button className="btn btn-primary" onClick={reset}>
            {t("common.retry")}
          </button>
        }
      />
    </section>
  );
}
