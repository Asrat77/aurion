"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";

export const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "am", label: "አማርኛ", name: "Amharic" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_STORAGE_KEY = "aurion_language";

export function isLanguageCode(value: string | null): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

// Everything is bundled: two languages of UI copy is a few kilobytes, and
// fetching them would mean a flash of untranslated text on every load.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    // React already guards against injection, and Suspense is unnecessary when
    // the resources ship with the bundle.
    react: { useSuspense: false },
  });
}

export default i18n;
