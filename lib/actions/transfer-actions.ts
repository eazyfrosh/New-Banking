"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { verifySecret } from "@/lib/actions/crypto";
import { checkAndRecordAttempt, resetAttempts } from "@/lib/actions/rate-limit";
import { generateReference } from "@/lib/utils";

export type TransferKind = "internal" | "bank" | "international";

interface TransferInput {
  userId: string;
  fromAccountId: string;
  kind: TransferKind;
  amount: number;
  pin: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank?: string;
  swiftCode?: string;
  note?: string;
}

export async function transferFunds(input: TransferInput) {
  const adminError = getAdminInitError();
  if (adminError) {
    return { ok: false as const, error: `Server is not configured: ${adminError}` };
  }
  if (input.amount <= 0) {
    return { ok: false as const, error: "Enter a valid amount." };
  }

  const attemptKey = `pin:${input.userId}`;
  const attempt = await checkAndRecordAttempt(attemptKey);
  if (!attempt.allowed) {
    return {
      ok: false as const,
      error: "Too many incorrect PIN attempts. Try again in 15 minutes.",
    };
  }

  const db = getAdminDb();
  const userRef = db.collection(COLLECTIONS.users).doc(input.userId);
  const userSnap = await userRef.get();
  const user = userSnap.data();

  if (!user?.transactionPin) {
    return { ok: false as const, error: "Set up a transaction PIN in Security Settings first." };
  }

  if (!verifySecret(input.pin, user.transactionPin)) {
    return { ok: false as const, error: `Incorrect PIN. ${attempt.remaining} attempts remaining.` };
  }

  await resetAttempts(attemptKey);

  const accountRef = db.collection(COLLECTIONS.accounts).doc(input.fromAccountId);
  const fee = input.kind === "international" ? Math.max(5, input.amount * 0.01) : 0;
  const total = input.amount + fee;

  try {
    const result = await db.runTransaction(async (trx) => {
      const accSnap = await trx.get(accountRef);
      const account = accSnap.data();

      if (!account || account.userId !== input.userId) {
        throw new Error("Account not found.");
      }
      if (account.balance < total) {
        throw new Error("Insufficient balance.");
      }

      trx.update(accountRef, { balance: FieldValue.increment(-total) });

      const status = input.kind === "internal" ? "completed" : "pending";
      const reference = generateReference();
      const txRef = db.collection(COLLECTIONS.transactions).doc();

      trx.set(txRef, {
        userId: input.userId,
        accountId: input.fromAccountId,
        type: `transfer_${input.kind}`,
        direction: "debit",
        amount: input.amount,
        currency: account.currency ?? "USD",
        status,
        reference,
        description: input.note || `Transfer to ${input.recipientName}`,
        counterparty: input.recipientName,
        counterpartyAccount: input.recipientAccount,
        fee,
        createdAt: new Date().toISOString(),
      });

      return { reference, status, fee };
    });

    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Transfer failed." };
  }
}
