export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyOption> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", decimals: 2 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", decimals: 2 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", decimals: 2 },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", decimals: 2 },
};

/**
 * Converts a human-readable decimal amount (e.g. 19.99 or "19.99") to integer minor units (e.g. 1999)
 */
export function toMinorUnits(amount: number | string, currencyCode = "USD"): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const numericVal = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;

  if (isNaN(numericVal)) {
    throw new Error("Invalid amount value");
  }

  const multiplier = Math.pow(10, currency.decimals);
  return Math.round(numericVal * multiplier);
}

/**
 * Converts integer minor units (e.g. 1999) to decimal float (e.g. 19.99)
 */
export function fromMinorUnits(minorUnits: number, currencyCode = "USD"): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const multiplier = Math.pow(10, currency.decimals);
  return minorUnits / multiplier;
}

/**
 * Formats integer minor units (e.g. 1999) into a localized formatted string (e.g. "$19.99")
 */
export function formatCurrency(
  minorUnits: number,
  currencyCode = "USD",
  locale = "en-US"
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const majorUnits = fromMinorUnits(minorUnits, currencyCode);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(majorUnits);
  } catch {
    return `${currency.symbol}${majorUnits.toFixed(currency.decimals)}`;
  }
}
