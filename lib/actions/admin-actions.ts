"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { initializeCustomerAccount } from "@/lib/actions/onboarding";
import { generateReference } from "@/lib/utils";

function guard() {
  const adminError = getAdminInitError();
  if (adminError) {
    return { ok: false as const, error: `Server is not configured: ${adminError}` };
  }
  return null;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const err = guard();
  if (err) return err;

  try {
    const adminAuth = await getAdminAuth();
    const userRecord = await adminAuth.createUser({
      email: input.email,
      password: input.password,
      displayName: `${input.firstName} ${input.lastName}`,
      emailVerified: true,
    });

    const setup = await initializeCustomerAccount({
      uid: userRecord.uid,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    if (!setup.ok) {
      await adminAuth.deleteUser(userRecord.uid).catch(() => null);
      return { ok: false as const, error: setup.error };
    }

    return { ok: true as const, uid: userRecord.uid };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to create user.") };
  }
}

export async function adminSetUserStatus(userId: string, status: "active" | "suspended" | "closed") {
  const err = guard();
  if (err) return err;

  try {
    await getAdminDb().collection(COLLECTIONS.users).doc(userId).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    const adminAuth = await getAdminAuth();
    await adminAuth.updateUser(userId, { disabled: status !== "active" });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to update user status.") };
  }
}

export async function adminDeleteUser(userId: string) {
  const err = guard();
  if (err) return err;

  try {
    const adminAuth = await getAdminAuth();
    await adminAuth.deleteUser(userId).catch(() => null);
    await getAdminDb().collection(COLLECTIONS.users).doc(userId).delete();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to delete user.") };
  }
}

export async function adminAdjustBalance(input: {
  accountId: string;
  amount: number;
  reason: string;
}) {
  const err = guard();
  if (err) return err;

  try {
    const accountRef = getAdminDb().collection(COLLECTIONS.accounts).doc(input.accountId);
    const snap = await accountRef.get();
    const account = snap.data();
    if (!account) return { ok: false as const, error: "Account not found." };

    await accountRef.update({ balance: FieldValue.increment(input.amount) });

    await getAdminDb().collection(COLLECTIONS.transactions).add({
      userId: account.userId,
      accountId: input.accountId,
      type: input.amount >= 0 ? "deposit" : "withdrawal",
      direction: input.amount >= 0 ? "credit" : "debit",
      amount: Math.abs(input.amount),
      currency: account.currency ?? "USD",
      status: "completed",
      reference: generateReference(),
      description: `Admin adjustment: ${input.reason}`,
      createdAt: new Date().toISOString(),
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to adjust balance.") };
  }
}

export async function adminCreateTransaction(input: {
  userId: string;
  accountId: string;
  amount: number;
  direction: "credit" | "debit";
  description: string;
}) {
  const err = guard();
  if (err) return err;

  try {
    const accountRef = getAdminDb().collection(COLLECTIONS.accounts).doc(input.accountId);
    const snap = await accountRef.get();
    if (!snap.exists) return { ok: false as const, error: "Account not found." };

    const delta = input.direction === "credit" ? input.amount : -input.amount;
    await accountRef.update({ balance: FieldValue.increment(delta) });

    const ref = getAdminDb().collection(COLLECTIONS.transactions).doc();
    await ref.set({
      userId: input.userId,
      accountId: input.accountId,
      type: input.direction === "credit" ? "deposit" : "withdrawal",
      direction: input.direction,
      amount: input.amount,
      currency: "USD",
      status: "completed",
      reference: generateReference(),
      description: input.description,
      createdAt: new Date().toISOString(),
    });

    return { ok: true as const, id: ref.id };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to create transaction.") };
  }
}

export async function adminReverseTransaction(transactionId: string) {
  const err = guard();
  if (err) return err;

  try {
    const txRef = getAdminDb().collection(COLLECTIONS.transactions).doc(transactionId);
    const snap = await txRef.get();
    const tx = snap.data();
    if (!tx) return { ok: false as const, error: "Transaction not found." };
    if (tx.status === "reversed") return { ok: false as const, error: "Already reversed." };

    const accountRef = getAdminDb().collection(COLLECTIONS.accounts).doc(tx.accountId);
    const delta = tx.direction === "credit" ? -tx.amount : tx.amount;

    await accountRef.update({ balance: FieldValue.increment(delta) });
    await txRef.update({ status: "reversed" });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to reverse transaction.") };
  }
}

export async function adminReviewTransfer(transactionId: string, approve: boolean) {
  const err = guard();
  if (err) return err;

  try {
    const txRef = getAdminDb().collection(COLLECTIONS.transactions).doc(transactionId);
    const snap = await txRef.get();
    const tx = snap.data();
    if (!tx) return { ok: false as const, error: "Transaction not found." };

    if (approve) {
      await txRef.update({ status: "completed" });
    } else {
      const accountRef = getAdminDb().collection(COLLECTIONS.accounts).doc(tx.accountId);
      await accountRef.update({ balance: FieldValue.increment(tx.amount + (tx.fee ?? 0)) });
      await txRef.update({ status: "failed" });
    }

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to review transfer.") };
  }
}

export async function adminBroadcastNotification(input: {
  title: string;
  message: string;
  type: "system" | "promo" | "security";
}) {
  const err = guard();
  if (err) return err;

  try {
    await getAdminDb().collection(COLLECTIONS.notifications).add({
      userId: "all",
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to broadcast notification.") };
  }
}
