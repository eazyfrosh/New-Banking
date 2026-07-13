"use server";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { generateAccountNumber, generateReference } from "@/lib/utils";

interface InitInput {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}

function log(uid: string, step: string, extra?: unknown) {
  console.log(`[initializeCustomerAccount][${uid}] ${step}`, extra ?? "");
}

/**
 * Creates a new customer's full starting state: profile, three accounts, a
 * virtual card, seed transactions, and a welcome notification. Writes all
 * 10 documents in a single atomic Firestore batch - either everything
 * exists or nothing does, so a failure here can never leave a half-set-up
 * account. Deterministic (uid-derived) document IDs make this idempotent:
 * calling it again for the same uid overwrites the same 10 documents
 * instead of creating duplicates, so it's safe to retry after a failure.
 */
export async function initializeCustomerAccount(input: InitInput) {
  log(input.uid, "starts", { email: input.email });

  const adminError = getAdminInitError();
  if (adminError) {
    log(input.uid, "aborted: admin not configured", adminError);
    return { ok: false as const, error: `Account setup is unavailable: ${adminError}` };
  }

  const db = getAdminDb();
  const now = new Date().toISOString();

  const currentAccountId = `acc_${input.uid}_current`;
  const savingsAccountId = `acc_${input.uid}_savings`;
  const fixedAccountId = `acc_${input.uid}_fixed`;

  try {
    const batch = db.batch();

    batch.set(
      db.collection(COLLECTIONS.users).doc(input.uid),
      {
        uid: input.uid,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "customer",
        status: "active",
        kycStatus: "unverified",
        currency: "USD",
        language: "en",
        notificationPrefs: { email: true, push: true, sms: false },
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(db.collection(COLLECTIONS.accounts).doc(currentAccountId), {
      userId: input.uid,
      type: "current",
      name: "Current Account",
      accountNumber: generateAccountNumber(),
      balance: 5000,
      currency: "USD",
      isPrimary: true,
      createdAt: now,
    });
    batch.set(db.collection(COLLECTIONS.accounts).doc(savingsAccountId), {
      userId: input.uid,
      type: "savings",
      name: "Savings Account",
      accountNumber: generateAccountNumber(),
      balance: 12500,
      currency: "USD",
      interestRate: 4.5,
      createdAt: now,
    });
    batch.set(db.collection(COLLECTIONS.accounts).doc(fixedAccountId), {
      userId: input.uid,
      type: "fixed_deposit",
      name: "Fixed Deposit",
      accountNumber: generateAccountNumber(),
      balance: 20000,
      currency: "USD",
      interestRate: 7.2,
      maturityDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
      createdAt: now,
    });

    batch.set(db.collection(COLLECTIONS.cards).doc(`card_${input.uid}_primary`), {
      userId: input.uid,
      accountId: currentAccountId,
      type: "virtual",
      network: "visa",
      cardholderName: `${input.firstName} ${input.lastName}`.toUpperCase(),
      cardNumber: `4${Math.floor(100000000000000 + Math.random() * 899999999999999)}`,
      expiryMonth: "12",
      expiryYear: String(new Date().getFullYear() + 4),
      cvv: String(Math.floor(100 + Math.random() * 899)),
      pin: "1234",
      status: "active",
      dailyLimit: 2000,
      monthlyLimit: 20000,
      color: "from-indigo-600 to-violet-600",
      createdAt: now,
    });

    const seedTransactions = [
      { desc: "Welcome bonus", amount: 50, type: "deposit", direction: "credit" as const },
      { desc: "Grocery Mart", amount: 84.32, type: "card_payment", direction: "debit" as const },
      { desc: "Salary deposit", amount: 3200, type: "deposit", direction: "credit" as const },
      { desc: "Electric Co. bill", amount: 120.5, type: "bill_payment", direction: "debit" as const },
    ];
    seedTransactions.forEach((tx, i) => {
      const ref = db.collection(COLLECTIONS.transactions).doc(`tx_${input.uid}_seed_${i}`);
      const createdAt = new Date(Date.now() - (seedTransactions.length - i) * 86_400_000).toISOString();
      batch.set(ref, {
        userId: input.uid,
        accountId: currentAccountId,
        type: tx.type,
        direction: tx.direction,
        amount: tx.amount,
        currency: "USD",
        status: "completed",
        reference: generateReference(),
        description: tx.desc,
        createdAt,
      });
    });

    batch.set(db.collection(COLLECTIONS.notifications).doc(`notif_${input.uid}_welcome`), {
      userId: input.uid,
      type: "system",
      title: "Welcome to Nexora Bank",
      message: "Your account has been created successfully. Explore your dashboard to get started.",
      read: false,
      archived: false,
      createdAt: now,
    });

    log(input.uid, "committing atomic batch", { writes: 10 });
    await batch.commit();
    log(input.uid, "succeeded");

    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[initializeCustomerAccount][${input.uid}] failed:`, err);
    return { ok: false as const, error: `Account setup failed: ${message}` };
  }
}
