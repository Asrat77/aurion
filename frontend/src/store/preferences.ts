import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LanguageCode } from "@/i18n";

export type DisplayCurrency = "USD" | "ETB";

interface PreferencesState {
  language: LanguageCode;
  currency: DisplayCurrency;
  /** Birr per USD, refreshed from the API so display never hardcodes a rate. */
  etbPerUsd: number;
  setLanguage: (language: LanguageCode) => void;
  setCurrency: (currency: DisplayCurrency) => void;
  setEtbPerUsd: (rate: number) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: "en",
      currency: "USD",
      // A sensible default only until /settings answers; it is never used to
      // price an order, which the server always does.
      etbPerUsd: 140,
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setEtbPerUsd: (etbPerUsd) => set({ etbPerUsd }),
    }),
    {
      name: "aurion_preferences",
      // The rate is server state, not a preference — do not persist a stale one.
      partialize: (state) => ({ language: state.language, currency: state.currency }),
    },
  ),
);
