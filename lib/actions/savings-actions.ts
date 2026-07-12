"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { generateReference } from "@/lib/utils";
import type { SavingsPlanType } from "@/types";

interface CreatePlanInput {
  userId: string;
  type: SavingsPlanType;
  name: string;
  targetAmount?: number;
  interestRate: number;
  endDate?: string;
  frequency?: "daily" | "weekly" | "monthly";
  autoSaveAmount?: number;
  initialDeposit: number;
  fundingAccountId: string;
}

export async function createSavingsPlan(input: CreatePlanInput) {
  if (!isAdminConfigured || !adminDb) return { ok: false as const, error: "Server is not configured." };
  const db = adminDb;

  const accountRef = db.collection(COLLECTIONS.accounts).doc(input.fundingAccountId);

  try {
    const planId = await db.runTransaction(async (trx) => {
      const snap = await trx.get(accountRef);
      const account = snap.data();
      if (!account || account.userId !== input.userId) throw new Error("Account not found.");
      if (input.initialDeposit > 0 && account.balance < input.initialDeposit) {
        throw new Error("Insufficient balance for initial deposit.");
      }

      const now = new Date().toISOString();
      const planRef = db.collection(COLLECTIONS.savingsPlans).doc();

      trx.set(planRef, {
        userId: input.userId,
        type: input.type,
        name: input.name,
        targetAmount: input.targetAmount,
        currentAmount: input.initialDeposit,
        interestRate: input.interestRate,
        startDate: now,
        endDate: input.endDate,
        frequency: input.frequency,
        autoSaveAmount: input.autoSaveAmount,
        status: "active",
        createdAt: now,
      });

      if (input.initialDeposit > 0) {
        trx.update(accountRef, { balance: FieldValue.increment(-input.initialDeposit) });
        trx.set(db.collection(COLLECTIONS.transactions).doc(), {
          userId: input.userId,
          accountId: input.fundingAccountId,
          type: "investment",
          direction: "debit",
          amount: input.initialDeposit,
          currency: account.currency ?? "USD",
          status: "completed",
          reference: generateReference(),
          description: `${input.name} - initial deposit`,
          createdAt: now,
        });
      }

      return planRef.id;
    });

    return { ok: true as const, id: planId };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to create plan." };
  }
}

export async function fundSavingsPlan(input: {
  userId: string;
  planId: string;
  fundingAccountId: string;
  amount: number;
}) {
  if (!isAdminConfigured || !adminDb) return { ok: false as const, error: "Server is not configured." };
  const db = adminDb;

  const accountRef = db.collection(COLLECTIONS.accounts).doc(input.fundingAccountId);
  const planRef = db.collection(COLLECTIONS.savingsPlans).doc(input.planId);

  try {
    await db.runTransaction(async (trx) => {
      const [accSnap, planSnap] = await Promise.all([trx.get(accountRef), trx.get(planRef)]);
      const account = accSnap.data();
      const plan = planSnap.data();
      if (!account || account.userId !== input.userId) throw new Error("Account not found.");
      if (!plan || plan.userId !== input.userId) throw new Error("Savings plan not found.");
      if (account.balance < input.amount) throw new Error("Insufficient balance.");

      trx.update(accountRef, { balance: FieldValue.increment(-input.amount) });
      trx.update(planRef, { currentAmount: FieldValue.increment(input.amount) });

      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: input.userId,
        accountId: input.fundingAccountId,
        type: "investment",
        direction: "debit",
        amount: input.amount,
        currency: account.currency ?? "USD",
        status: "completed",
        reference: generateReference(),
        description: `${plan.name} - top up`,
        createdAt: new Date().toISOString(),
      });
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to fund plan." };
  }
}
