"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { generateReference } from "@/lib/utils";
import type { InvestmentType } from "@/types";

export async function buyInvestment(input: {
  userId: string;
  accountId: string;
  type: InvestmentType;
  symbol: string;
  name: string;
  units: number;
  price: number;
}) {
  if (!isAdminConfigured || !adminDb) return { ok: false as const, error: "Server is not configured." };
  const db = adminDb;

  const cost = input.units * input.price;
  const accountRef = db.collection(COLLECTIONS.accounts).doc(input.accountId);

  try {
    await db.runTransaction(async (trx) => {
      const snap = await trx.get(accountRef);
      const account = snap.data();
      if (!account || account.userId !== input.userId) throw new Error("Account not found.");
      if (account.balance < cost) throw new Error("Insufficient balance.");

      trx.update(accountRef, { balance: FieldValue.increment(-cost) });

      const invRef = db.collection(COLLECTIONS.investments).doc();
      trx.set(invRef, {
        userId: input.userId,
        type: input.type,
        symbol: input.symbol,
        name: input.name,
        units: input.units,
        avgBuyPrice: input.price,
        currentPrice: input.price,
        currency: "USD",
        createdAt: new Date().toISOString(),
      });

      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: input.userId,
        accountId: input.accountId,
        type: "investment",
        direction: "debit",
        amount: cost,
        currency: "USD",
        status: "completed",
        reference: generateReference(),
        description: `Bought ${input.units} ${input.symbol}`,
        createdAt: new Date().toISOString(),
      });
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Purchase failed." };
  }
}

export async function sellInvestment(input: {
  userId: string;
  accountId: string;
  investmentId: string;
  units: number;
}) {
  if (!isAdminConfigured || !adminDb) return { ok: false as const, error: "Server is not configured." };
  const db = adminDb;

  const invRef = db.collection(COLLECTIONS.investments).doc(input.investmentId);
  const accountRef = db.collection(COLLECTIONS.accounts).doc(input.accountId);

  try {
    await db.runTransaction(async (trx) => {
      const [invSnap, accSnap] = await Promise.all([trx.get(invRef), trx.get(accountRef)]);
      const inv = invSnap.data();
      const account = accSnap.data();
      if (!inv || inv.userId !== input.userId) throw new Error("Investment not found.");
      if (!account || account.userId !== input.userId) throw new Error("Account not found.");
      if (input.units > inv.units) throw new Error("Cannot sell more units than owned.");

      const proceeds = input.units * inv.currentPrice;
      const remainingUnits = inv.units - input.units;

      if (remainingUnits === 0) {
        trx.delete(invRef);
      } else {
        trx.update(invRef, { units: remainingUnits });
      }

      trx.update(accountRef, { balance: FieldValue.increment(proceeds) });

      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: input.userId,
        accountId: input.accountId,
        type: "investment",
        direction: "credit",
        amount: proceeds,
        currency: "USD",
        status: "completed",
        reference: generateReference(),
        description: `Sold ${input.units} ${inv.symbol}`,
        createdAt: new Date().toISOString(),
      });
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Sale failed." };
  }
}
