import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { currencyDecimals, getCurrencyInfo } from "@/lib/currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Symbol comes from our own currency table (not Intl's locale data) so every
 * supported currency renders a correct, consistent symbol regardless of the
 * runtime's ICU data. */
export function formatCurrency(amount: number, currency = "USD") {
  const decimals = currencyDecimals(currency);
  const sign = amount < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));
  return `${sign}${getCurrencyInfo(currency).symbol}${formatted}`;
}

export function formatDate(date: Date | string | number, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: opts ? undefined : "short",
    ...opts,
  }).format(d);
}

export function maskAccountNumber(accountNumber: string) {
  if (accountNumber.length <= 4) return accountNumber;
  return `••••${accountNumber.slice(-4)}`;
}

export function maskCardNumber(cardNumber: string) {
  const clean = cardNumber.replace(/\s/g, "");
  return `•••• •••• •••• ${clean.slice(-4)}`;
}

export function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function generateReference() {
  return `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
