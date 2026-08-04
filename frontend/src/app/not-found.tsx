"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="min-h-[100dvh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="display-hero mb-4">404</h1>
        <p className="text-[var(--text-secondary)] mb-8">{t("errors.notFound")}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="btn btn-outline">
            {t("errors.backHome")}
          </Link>
          <Link href="/store" className="btn btn-primary">
            {t("errors.exploreStore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
