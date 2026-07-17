export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

/** The 21 currencies explicitly requested, plus a few more major world currencies. */
export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", flag: "🇲🇽" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦" },
];

export const DEFAULT_CURRENCY = "USD";

export const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW"]);

/** 0.5% - shown to the user before every conversion is confirmed. */
export const CONVERSION_FEE_RATE = 0.005;

const currencyMap = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyInfo(code: string): CurrencyInfo {
  return currencyMap.get(code) ?? { code, name: code, symbol: code, flag: "💱" };
}

export function currencyDecimals(code: string) {
  return ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
}

/**
 * Approximate USD-based rates used only when the live rate provider is
 * unreachable, so the app degrades gracefully instead of breaking. Never
 * presented as live data - callers must surface `live: false` from
 * getExchangeRates whenever this fallback is what was actually used.
 */
export const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1580.5,
  KRW: 1385,
  JPY: 149.82,
  CAD: 1.36,
  AUD: 1.52,
  CNY: 7.24,
  INR: 84.3,
  SGD: 1.34,
  HKD: 7.81,
  AED: 3.67,
  CHF: 0.88,
  SEK: 10.45,
  NOK: 10.62,
  DKK: 6.86,
  ZAR: 18.4,
  MXN: 17.1,
  BRL: 5.4,
  TRY: 34.2,
  NZD: 1.66,
  SAR: 3.75,
};
