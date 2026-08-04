// Every amount the API returns is denominated in the platform's base currency
// (USD cents). An order also carries the currency the buyer was quoted in and
// the rate used, so display is always base cents × rate — never a raw `$`.

import { usePreferencesStore } from "@/store/preferences";

export const BASE_CURRENCY = "USD";

const SYMBOLS: Record<string, string> = {
  USD: "$",
  ETB: "Br",
};

export function currencySymbol(currency: string) {
  return SYMBOLS[currency] ?? `${currency} `;
}

/**
 * Formats base-currency cents for display.
 *
 * @param cents amount in base-currency cents, as stored and returned by the API
 * @param currency the currency to present it in
 * @param fxRate units of `currency` per 1 unit of base currency
 */
export function formatMoney(cents: number, currency = BASE_CURRENCY, fxRate = 1) {
  const amount = (cents * fxRate) / 100;
  // Birr is conventionally written without decimals at these magnitudes; USD
  // keeps cents because product prices are set in them.
  const fractionDigits = currency === "ETB" ? 0 : 2;

  return `${currencySymbol(currency)}${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

/**
 * Formats an amount in the platform's base currency, ignoring the buyer's
 * display preference. Use for figures that must stay comparable across the
 * platform — vendor payouts, admin revenue, commission.
 */
export function formatBase(cents: number) {
  return formatMoney(cents, BASE_CURRENCY, 1);
}

/**
 * Formats a catalogue price in whatever currency the buyer has chosen to
 * browse in. This is presentation only: an order is always priced by the
 * server, which decides the real currency from the shipping destination.
 */
export function usePrice() {
  const currency = usePreferencesStore((s) => s.currency);
  const etbPerUsd = usePreferencesStore((s) => s.etbPerUsd);

  return (cents: number) =>
    currency === "ETB" ? formatMoney(cents, "ETB", etbPerUsd) : formatBase(cents);
}
