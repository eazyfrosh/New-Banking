"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { initializeCustomerAccount } from "@/lib/actions/onboarding";
import { generateReference } from "@/lib/utils";

function guard() {
  if (!isAdminConfigured || !adminDb || !adminAuth) {
    return { ok: false as const, error: "Server is not configured." };
  }
  return null;
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const err = guard();
  if (err) return err;

  const userRecord = await adminAuth!.createUser({
    email: input.email,
    password: input.password,
    displayName: `${input.firstName} ${input.lastName}`,
    emailVerified: true,
  });

  await initializeCustomerAccount({
    uid: userRecord.uid,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  return { ok: true as const, uid: userRecord.uid };
}

export async function adminSetUserStatus(userId: string, status: "active" | "suspended" | "closed") {
  const err = guard();
  if (err) return err;

  await adminDb!.collection(COLLECTIONS.users).doc(userId).update({
    status,
    updatedAt: new Date().toISOString(),
  });
  await adminAuth!.updateUser(userId, { disabled: status !== "active" });

  return { ok: true as const };
}

export async function adminDeleteUser(userId: string) {
  const err = guard();
  if (err) return err;

  await adminAuth!.deleteUser(userId).catch(() => null);
  await adminDb!.collection(COLLECTIONS.users).doc(userId).delete();

  return { ok: true as const };
}

export async function adminAdjustBalance(input: {
  accountId: string;
  amount: number;
  reason: string;
}) {
  const err = guard();
  if (err) return err;

  const accountRef = adminDb!.collection(COLLECTIONS.accounts).doc(input.accountId);
  const snap = await accountRef.get();
  const account = snap.data();
  if (!account) return { ok: false as const, error: "Account not found." };

  await accountRef.update({ balance: FieldValue.increment(input.amount) });

  await adminDb!.collection(COLLECTIONS.transactions).add({
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

  const accountRef = adminDb!.collection(COLLECTIONS.accounts).doc(input.accountId);
  const delta = input.direction === "credit" ? input.amount : -input.amount;

  await accountRef.update({ balance: FieldValue.increment(delta) });

  const ref = adminDb!.collection(COLLECTIONS.transactions).doc();
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
}

export async function adminReverseTransaction(transactionId: string) {
  const err = guard();
  if (err) return err;

  const txRef = adminDb!.collection(COLLECTIONS.transactions).doc(transactionId);
  const snap = await txRef.get();
  const tx = snap.data();
  if (!tx) return { ok: false as const, error: "Transaction not found." };
  if (tx.status === "reversed") return { ok: false as const, error: "Already reversed." };

  const accountRef = adminDb!.collection(COLLECTIONS.accounts).doc(tx.accountId);
  const delta = tx.direction === "credit" ? -tx.amount : tx.amount;

  await accountRef.update({ balance: FieldValue.increment(delta) });
  await txRef.update({ status: "reversed" });

  return { ok: true as const };
}

export async function adminReviewTransfer(transactionId: string, approve: boolean) {
  const err = guard();
  if (err) return err;

  const txRef = adminDb!.collection(COLLECTIONS.transactions).doc(transactionId);
  const snap = await txRef.get();
  const tx = snap.data();
  if (!tx) return { ok: false as const, error: "Transaction not found." };

  if (approve) {
    await txRef.update({ status: "completed" });
  } else {
    const accountRef = adminDb!.collection(COLLECTIONS.accounts).doc(tx.accountId);
    await accountRef.update({ balance: FieldValue.increment(tx.amount + (tx.fee ?? 0)) });
    await txRef.update({ status: "failed" });
  }

  return { ok: true as const };
}

export async function adminBroadcastNotification(input: {
  title: string;
  message: string;
  type: "system" | "promo" | "security";
}) {
  const err = guard();
  if (err) return err;

  await adminDb!.collection(COLLECTIONS.notifications).add({
    userId: "all",
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    archived: false,
    createdAt: new Date().toISOString(),
  });

  return { ok: true as const };
}
