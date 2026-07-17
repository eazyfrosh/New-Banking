"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { verifySecret } from "@/lib/actions/crypto";
import { checkAndRecordAttempt, resetAttempts } from "@/lib/actions/rate-limit";
import { generateAccountNumber, generateReference } from "@/lib/utils";
import { CONVERSION_FEE_RATE, CURRENCIES, DEFAULT_CURRENCY, FALLBACK_USD_RATES } from "@/lib/currencies";
import type { Account, AccountType } from "@/types";

export interface RatesResult {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
  /** false means the live provider was unreachable and these are static fallback rates. */
  live: boolean;
}

const RATE_PROVIDER_URL = (base: string) => `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
const CACHE_TTL_MS = 10 * 60 * 1000;

// Per-server-instance cache. Exchange rates don't need to be fetched on
// every dashboard render - a coarse in-memory cache keeps us well under any
// free-tier rate limit without needing a Firestore round trip.
const rateCache = new Map<string, { data: RatesResult; expiresAt: number }>();

function buildFallbackRates(base: string): Record<string, number> {
  if (base === "USD") return { ...FALLBACK_USD_RATES };
  const baseRate = FALLBACK_USD_RATES[base];
  if (!baseRate) return { ...FALLBACK_USD_RATES };
  const converted: Record<string, number> = {};
  for (const [code, rate] of Object.entries(FALLBACK_USD_RATES)) {
    converted[code] = rate / baseRate;
  }
  return converted;
}

/**
 * Live exchange rates for `base`, with a static-table fallback if the
 * provider is unreachable or errors - the dashboard and converter must never
 * hard-fail just because a third-party API had a bad moment.
 */
export async function getExchangeRates(base: string = DEFAULT_CURRENCY): Promise<RatesResult> {
  const cached = rateCache.get(base);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const res = await fetch(RATE_PROVIDER_URL(base), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Rate provider returned ${res.status}`);
    const json = (await res.json()) as { rates?: Record<string, number> };
    if (!json.rates || typeof json.rates !== "object") throw new Error("Malformed rate response");

    const result: RatesResult = {
      base,
      rates: json.rates,
      fetchedAt: new Date().toISOString(),
      live: true,
    };
    rateCache.set(base, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.error("[getExchangeRates] live fetch failed, using fallback rates:", err);
    const result: RatesResult = {
      base,
      rates: buildFallbackRates(base),
      fetchedAt: new Date().toISOString(),
      live: false,
    };
    // Cache the fallback too, briefly, so a sustained provider outage
    // doesn't mean every request pays the full fetch timeout.
    rateCache.set(base, { data: result, expiresAt: Date.now() + 60_000 });
    return result;
  }
}

interface ConversionPreview {
  rate: number;
  fee: number;
  creditAmount: number;
  live: boolean;
  fetchedAt: string;
}

/** Rate + fee + amount the user would receive, shown before they confirm a conversion. */
export async function previewConversion(
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<{ ok: true } & ConversionPreview | { ok: false; error: string }> {
  if (!amount || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (fromCurrency === toCurrency) return { ok: false, error: "Choose two different currencies." };

  const rateData = await getExchangeRates(fromCurrency);
  const rate = rateData.rates[toCurrency];
  if (!rate) return { ok: false, error: `No exchange rate available for ${fromCurrency} → ${toCurrency}.` };

  const fee = Math.round(amount * CONVERSION_FEE_RATE * 100) / 100;
  const amountAfterFee = amount - fee;
  if (amountAfterFee <= 0) return { ok: false, error: "Amount is too small after fees." };
  const creditAmount = Math.round(amountAfterFee * rate * 100) / 100;

  return { ok: true, rate, fee, creditAmount, live: rateData.live, fetchedAt: rateData.fetchedAt };
}

const accountTypeNames: Record<AccountType, string> = {
  current: "Current Account",
  savings: "Savings Account",
  fixed_deposit: "Fixed Deposit",
};

/** Opens a new per-currency account for the signed-in customer, mirroring adminOpenAccount's shape. */
export async function openCurrencyAccount(userId: string, currency: string, type: AccountType = "current") {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  if (!userId) return { ok: false as const, error: "Not signed in." };

  const info = CURRENCIES.find((c) => c.code === currency);
  if (!info) return { ok: false as const, error: "Unsupported currency." };

  try {
    const db = getAdminDb();

    // Single equality where() - no composite index required.
    const existing = await db.collection(COLLECTIONS.accounts).where("userId", "==", userId).get();
    const duplicate = existing.docs.some((d) => {
      const data = d.data() as Account;
      return data.currency === currency && data.type === type;
    });
    if (duplicate) {
      return { ok: false as const, error: `You already have a ${currency} ${accountTypeNames[type].toLowerCase()}.` };
    }

    const ref = db.collection(COLLECTIONS.accounts).doc();
    const now = new Date().toISOString();
    await ref.set({
      userId,
      type,
      name: `${info.name} ${accountTypeNames[type]}`,
      accountNumber: generateAccountNumber(),
      balance: 0,
      currency,
      status: "active",
      ...(type === "savings" ? { interestRate: 4.5 } : {}),
      ...(type === "fixed_deposit"
        ? { interestRate: 7.2, maturityDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString() }
        : {}),
      createdAt: now,
    });

    return { ok: true as const, id: ref.id };
  } catch (err) {
    console.error("[openCurrencyAccount] failed:", err);
    return { ok: false as const, error: "Failed to open account." };
  }
}

interface ConvertInput {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  pin: string;
}

/**
 * Atomically moves money between two of the caller's own currency accounts,
 * converting at the rate fetched just before the transaction and recording
 * a linked debit/credit transaction pair (mirrors adminTransferFunds).
 * Rate/fee are pre-fetched outside runTransaction() - Firestore transactions
 * can retry on contention, and must never contain a network call.
 */
export async function convertCurrency(input: ConvertInput) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  if (input.amount <= 0) return { ok: false as const, error: "Enter a valid amount." };
  if (input.fromAccountId === input.toAccountId) {
    return { ok: false as const, error: "Choose two different currency accounts." };
  }

  const attemptKey = `pin:${input.userId}`;
  const attempt = await checkAndRecordAttempt(attemptKey);
  if (!attempt.allowed) {
    return { ok: false as const, error: "Too many incorrect PIN attempts. Try again in 15 minutes." };
  }

  const db = getAdminDb();
  const userSnap = await db.collection(COLLECTIONS.users).doc(input.userId).get();
  const user = userSnap.data();
  if (!user?.transactionPin) {
    return { ok: false as const, error: "Set up a transaction PIN in Security Settings first." };
  }
  if (!verifySecret(input.pin, user.transactionPin)) {
    return { ok: false as const, error: `Incorrect PIN. ${attempt.remaining} attempts remaining.` };
  }
  await resetAttempts(attemptKey);

  const fromRef = db.collection(COLLECTIONS.accounts).doc(input.fromAccountId);
  const toRef = db.collection(COLLECTIONS.accounts).doc(input.toAccountId);

  const [fromSnap0, toSnap0] = await Promise.all([fromRef.get(), toRef.get()]);
  const from0 = fromSnap0.data() as Account | undefined;
  const to0 = toSnap0.data() as Account | undefined;
  if (!from0 || from0.userId !== input.userId) return { ok: false as const, error: "Source account not found." };
  if (!to0 || to0.userId !== input.userId) return { ok: false as const, error: "Destination account not found." };
  if (from0.currency === to0.currency) {
    return { ok: false as const, error: "Choose two accounts with different currencies." };
  }

  const preview = await previewConversion(from0.currency, to0.currency, input.amount);
  if (!preview.ok) return { ok: false as const, error: preview.error };
  const { rate, fee, creditAmount } = preview;

  try {
    const result = await db.runTransaction(async (trx) => {
      const [fromSnap, toSnap] = await Promise.all([trx.get(fromRef), trx.get(toRef)]);
      const from = fromSnap.data() as Account | undefined;
      const to = toSnap.data() as Account | undefined;
      if (!from || from.userId !== input.userId) throw new Error("Source account not found.");
      if (!to || to.userId !== input.userId) throw new Error("Destination account not found.");
      if (from.balance < input.amount) throw new Error("Insufficient balance.");

      const now = new Date().toISOString();
      const reference = generateReference();

      trx.update(fromRef, { balance: FieldValue.increment(-input.amount) });
      trx.update(toRef, { balance: FieldValue.increment(creditAmount) });

      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: input.userId,
        accountId: input.fromAccountId,
        type: "currency_conversion",
        direction: "debit",
        amount: input.amount,
        currency: from.currency,
        status: "completed",
        reference,
        description: `Converted to ${to.currency}`,
        counterparty: "Currency conversion",
        counterpartyAccount: to.accountNumber,
        fee,
        createdAt: now,
      });
      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: input.userId,
        accountId: input.toAccountId,
        type: "currency_conversion",
        direction: "credit",
        amount: creditAmount,
        currency: to.currency,
        status: "completed",
        reference,
        description: `Converted from ${from.currency}`,
        counterparty: "Currency conversion",
        counterpartyAccount: from.accountNumber,
        createdAt: now,
      });

      return { reference };
    });

    return {
      ok: true as const,
      reference: result.reference,
      rate,
      fee,
      creditAmount,
      fromCurrency: from0.currency,
      toCurrency: to0.currency,
    };
  } catch (err) {
    console.error("[convertCurrency] failed:", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Conversion failed." };
  }
}
