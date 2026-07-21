"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { generateReference } from "@/lib/utils";
import type { BillCategory } from "@/types";

interface PayBillInput {
  userId: string;
  accountId: string;
  category: BillCategory;
  provider: string;
  accountReference: string;
  amount: number;
}

export async function payBill(input: PayBillInput) {
  const adminError = getAdminInitError();
  if (adminError) {
    return { ok: false as const, error: `Server is not configured: ${adminError}` };
  }
  if (input.amount <= 0) {
    return { ok: false as const, error: "Enter a valid amount." };
  }

  const db = getAdminDb();
  const accountRef = db.collection(COLLECTIONS.accounts).doc(input.accountId);

  try {
    const reference = await db.runTransaction(async (trx) => {
      const snap = await trx.get(accountRef);
      const account = snap.data();
      if (!account || account.userId !== input.userId) {
        throw new Error("Account not found.");
      }
      if (account.balance < input.amount) {
        throw new Error("Insufficient balance.");
      }

      trx.update(accountRef, { balance: FieldValue.increment(-input.amount) });

      const reference = generateReference();
      const now = new Date().toISOString();

      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: input.userId,
        accountId: input.accountId,
        type: "bill_payment",
        direction: "debit",
        amount: input.amount,
        currency: account.currency ?? "USD",
        status: "completed",
        reference,
        description: `${input.provider} payment`,
        category: input.category,
        createdAt: now,
      });

      trx.set(db.collection(COLLECTIONS.billPayments).doc(), {
        userId: input.userId,
        category: input.category,
        provider: input.provider,
        accountReference: input.accountReference,
        amount: input.amount,
        status: "completed",
        createdAt: now,
      });

      return reference;
    });

    return { ok: true as const, reference };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Payment failed." };
  }
}
