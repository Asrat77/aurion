"use client";

import { MapPin, Phone, EnvelopeSimple } from "@phosphor-icons/react/ssr";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/ui/PageHeader";

export default function ContactPage() {
  const { t } = useTranslation();
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-[var(--container-narrow)] mx-auto">
        <PageHeader
          title={t("contact.title")}
          description={t("contact.description")}
        />
        <div className="card flex flex-col gap-4">
          <span className="flex items-start gap-3 text-[var(--text-secondary)]">
            <MapPin size={18} className="text-[var(--gold)] mt-0.5 shrink-0" />
            Bole Road, Kirkos Sub-City, Addis Ababa, Ethiopia
          </span>
          <span className="flex items-center gap-3 text-[var(--text-secondary)]">
            <Phone size={18} className="text-[var(--gold)] shrink-0" />
            +251 11 7 123456
          </span>
          <span className="flex items-center gap-3 text-[var(--text-secondary)]">
            <EnvelopeSimple size={18} className="text-[var(--gold)] shrink-0" />
            info@aurionglobal.com
          </span>
          <a href="mailto:info@aurionglobal.com" className="btn btn-primary mt-4 text-center">
            {t("contact.emailUs")}
          </a>
        </div>
      </div>
    </section>
  );
}
