"use server";

import { randomUUID } from "crypto";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { generateAccountNumber, generateReference } from "@/lib/utils";

interface InitInput {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface LogContext {
  requestId: string;
  uid: string;
}

function log(ctx: LogContext, step: string, extra?: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      fn: "initializeCustomerAccount",
      requestId: ctx.requestId,
      uid: ctx.uid,
      step,
      ...extra,
      ts: new Date().toISOString(),
    })
  );
}

function logError(ctx: LogContext, step: string, err: unknown) {
  console.error(
    JSON.stringify({
      fn: "initializeCustomerAccount",
      requestId: ctx.requestId,
      uid: ctx.uid,
      step,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      ts: new Date().toISOString(),
    })
  );
}

/**
 * Creates a new customer's full starting state: profile, three accounts, a
 * virtual card, seed transactions, and a welcome notification. Writes all
 * 10 documents in a single atomic Firestore batch - either everything
 * exists or nothing does, so a failure here can never leave a half-set-up
 * account. Deterministic (uid-derived) document IDs make this idempotent:
 * calling it again for the same uid overwrites the same 10 documents
 * instead of creating duplicates, so it's safe to retry after a failure.
 *
 * Every step below is logged with a shared requestId so a single
 * invocation's log lines can be correlated end to end.
 */
export async function initializeCustomerAccount(input: InitInput) {
  const requestId = randomUUID();
  const ctx: LogContext = { requestId, uid: input.uid };

  log(ctx, "entering function", { email: input.email });

  try {
    log(ctx, "calling getAdminInitError()");
    const adminError = getAdminInitError();
    log(ctx, "getAdminInitError() returned", { adminError });

    if (adminError) {
      log(ctx, "aborted: admin not configured", { adminError });
      return { ok: false as const, error: `Account setup is unavailable: ${adminError}` };
    }

    log(ctx, "calling getAdminDb()");
    const db = getAdminDb();
    log(ctx, "getAdminDb() returned");

    const now = new Date().toISOString();

    const currentAccountId = `acc_${input.uid}_current`;
    const savingsAccountId = `acc_${input.uid}_savings`;
    const fixedAccountId = `acc_${input.uid}_fixed`;

    try {
      const batch = db.batch();

      const userRef = db.collection(COLLECTIONS.users).doc(input.uid);
      batch.set(
        userRef,
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
      log(ctx, "queued Firestore write", { op: "batch.set", path: userRef.path });

      const currentAccountRef = db.collection(COLLECTIONS.accounts).doc(currentAccountId);
      batch.set(currentAccountRef, {
        userId: input.uid,
        type: "current",
        name: "Current Account",
        accountNumber: generateAccountNumber(),
        balance: 5000,
        currency: "USD",
        isPrimary: true,
        createdAt: now,
      });
      log(ctx, "queued Firestore write", { op: "batch.set", path: currentAccountRef.path });

      const savingsAccountRef = db.collection(COLLECTIONS.accounts).doc(savingsAccountId);
      batch.set(savingsAccountRef, {
        userId: input.uid,
        type: "savings",
        name: "Savings Account",
        accountNumber: generateAccountNumber(),
        balance: 12500,
        currency: "USD",
        interestRate: 4.5,
        createdAt: now,
      });
      log(ctx, "queued Firestore write", { op: "batch.set", path: savingsAccountRef.path });

      const fixedAccountRef = db.collection(COLLECTIONS.accounts).doc(fixedAccountId);
      batch.set(fixedAccountRef, {
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
      log(ctx, "queued Firestore write", { op: "batch.set", path: fixedAccountRef.path });

      const cardRef = db.collection(COLLECTIONS.cards).doc(`card_${input.uid}_primary`);
      batch.set(cardRef, {
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
      log(ctx, "queued Firestore write", { op: "batch.set", path: cardRef.path });

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
        log(ctx, "queued Firestore write", { op: "batch.set", path: ref.path });
      });

      const notifRef = db.collection(COLLECTIONS.notifications).doc(`notif_${input.uid}_welcome`);
      batch.set(notifRef, {
        userId: input.uid,
        type: "system",
        title: "Welcome to Nexora Bank",
        message: "Your account has been created successfully. Explore your dashboard to get started.",
        read: false,
        archived: false,
        createdAt: now,
      });
      log(ctx, "queued Firestore write", { op: "batch.set", path: notifRef.path });

      log(ctx, "calling batch.commit()", { totalWrites: 10 });
      await batch.commit();
      log(ctx, "batch.commit() succeeded", { totalWrites: 10 });

      log(ctx, "exiting function: success");
      return { ok: true as const };
    } catch (err) {
      logError(ctx, "caught exception during batch write/commit", err);
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false as const, error: `Account setup failed: ${message}` };
    }
  } catch (err) {
    // Nothing above this point is expected to throw (getAdminInitError never
    // throws by design), but if it ever does, log it with full context
    // before rethrowing unchanged - this function's behavior for an
    // uncaught error is identical to before, it's now just logged first.
    logError(ctx, "uncaught exception", err);
    throw err;
  }
}
