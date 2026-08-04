"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { isLanguageCode } from "@/i18n";
import { usePreferencesStore } from "@/store/preferences";
import { useSettings } from "@/lib/settings";

/**
 * Applies the stored language to i18next and to <html lang>, and keeps the
 * birr rate used for price display in sync with the server.
 */
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = usePreferencesStore((s) => s.language);
  const setEtbPerUsd = usePreferencesStore((s) => s.setEtbPerUsd);
  const { data: settings } = useSettings();

  useEffect(() => {
    if (!isLanguageCode(language)) return;

    i18n.changeLanguage(language);
    // Screen readers and the browser's own translation prompt both key off
    // this, so it has to follow the switcher rather than stay "en".
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (settings?.etbPerUsd) setEtbPerUsd(settings.etbPerUsd);
  }, [settings?.etbPerUsd, setEtbPerUsd]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
