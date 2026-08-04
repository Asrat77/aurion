"use client";

import { useTranslation } from "react-i18next";
import { LANGUAGES, type LanguageCode } from "@/i18n";
import { usePreferencesStore, type DisplayCurrency } from "@/store/preferences";

const CURRENCIES: { code: DisplayCurrency; label: string }[] = [
  { code: "USD", label: "USD" },
  { code: "ETB", label: "ETB" },
];

/**
 * Language and browsing-currency switcher. Currency here is display only — an
 * order is priced by the server from its shipping destination.
 */
export default function PreferenceSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const currency = usePreferencesStore((s) => s.currency);
  const setCurrency = usePreferencesStore((s) => s.setCurrency);

  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <Group label={t("common.language")}>
        {LANGUAGES.map((option) => (
          <Choice
            key={option.code}
            active={language === option.code}
            onClick={() => setLanguage(option.code as LanguageCode)}
            title={option.name}
          >
            {option.label}
          </Choice>
        ))}
      </Group>

      <Group label={t("common.currency")}>
        {CURRENCIES.map((option) => (
          <Choice
            key={option.code}
            active={currency === option.code}
            onClick={() => setCurrency(option.code)}
            title={option.label}
          >
            {option.label}
          </Choice>
        ))}
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-full border border-[var(--border-subtle)] p-0.5"
    >
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-8 cursor-pointer rounded-full px-2.5 text-[0.68rem] font-semibold transition-colors ${
        active
          ? "bg-[var(--gold)] text-[var(--bg-deep)]"
          : "text-[var(--text-muted)] hover:text-[var(--gold)]"
      }`}
    >
      {children}
    </button>
  );
}
