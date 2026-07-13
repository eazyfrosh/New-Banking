"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { calculateMonthlyRepayment } from "@/lib/services/loans";
import { generateReference } from "@/lib/utils";

export async function applyForLoan(input: {
  userId: string;
  amount: number;
  termMonths: number;
  purpose: string;
}) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };

  try {
    const db = getAdminDb();
    const interestRate = 12.5;
    const monthlyRepayment = calculateMonthlyRepayment(input.amount, interestRate, input.termMonths);
    const now = new Date().toISOString();

    const ref = db.collection(COLLECTIONS.loans).doc();
    await ref.set({
      userId: input.userId,
      amount: input.amount,
      interestRate,
      termMonths: input.termMonths,
      purpose: input.purpose,
      status: "pending",
      monthlyRepayment,
      outstandingBalance: input.amount,
      createdAt: now,
    });

    return { ok: true as const, id: ref.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to submit loan application." };
  }
}

export async function adminReviewLoan(input: {
  loanId: string;
  approve: boolean;
  disburseAccountId?: string;
}) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  const db = getAdminDb();

  const loanRef = db.collection(COLLECTIONS.loans).doc(input.loanId);

  try {
    await db.runTransaction(async (trx) => {
      const loanSnap = await trx.get(loanRef);
      const loan = loanSnap.data();
      if (!loan) throw new Error("Loan not found.");

      if (!input.approve) {
        trx.update(loanRef, { status: "rejected" });
        return;
      }

      const now = new Date().toISOString();
      trx.update(loanRef, {
        status: "active",
        disbursedAt: now,
        nextRepaymentDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

      if (input.disburseAccountId) {
        const accountRef = db.collection(COLLECTIONS.accounts).doc(input.disburseAccountId);
        trx.update(accountRef, { balance: FieldValue.increment(loan.amount) });
        trx.set(db.collection(COLLECTIONS.transactions).doc(), {
          userId: loan.userId,
          accountId: input.disburseAccountId,
          type: "loan_disbursement",
          direction: "credit",
          amount: loan.amount,
          currency: "USD",
          status: "completed",
          reference: generateReference(),
          description: `Loan disbursement - ${loan.purpose}`,
          createdAt: now,
        });
      }
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to review loan." };
  }
}

export async function repayLoan(input: {
  userId: string;
  loanId: string;
  accountId: string;
  amount: number;
}) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  const db = getAdminDb();

  const accountRef = db.collection(COLLECTIONS.accounts).doc(input.accountId);
  const loanRef = db.collection(COLLECTIONS.loans).doc(input.loanId);

  try {
    await db.runTransaction(async (trx) => {
      const [accSnap, loanSnap] = await Promise.all([trx.get(accountRef), trx.get(loanRef)]);
      const account = accSnap.data();
      const loan = loanSnap.data();
      if (!account || account.userId !== input.userId) throw new Error("Account not found.");
      if (!loan || loan.userId !== input.userId) throw new Error("Loan not found.");
      if (account.balance < input.amount) throw new Error("Insufficient balance.");

      const newOutstanding = Math.max(0, loan.outstandingBalance - input.amount);
      trx.update(accountRef, { balance: FieldValue.increment(-input.amount) });
      trx.update(loanRef, {
        outstandingBalance: newOutstanding,
        status: newOutstanding === 0 ? "completed" : loan.status,
        nextRepaymentDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: input.userId,
        accountId: input.accountId,
        type: "loan_repayment",
        direction: "debit",
        amount: input.amount,
        currency: account.currency ?? "USD",
        status: "completed",
        reference: generateReference(),
        description: "Loan repayment",
        createdAt: new Date().toISOString(),
      });
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Repayment failed." };
  }
}
