"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin, writeAuditLog } from "@/lib/actions/admin-guard";
import { restCreateUser, restDeleteUser, restSetUserDisabled, restUpdateUserEmail } from "@/lib/actions/identity-rest";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { initializeCustomerAccount } from "@/lib/actions/onboarding";
import { CURRENCIES } from "@/lib/currencies";
import { generateAccountNumber, generateReference } from "@/lib/utils";
import type { AccountStatus, AccountType, CardStatus, TransactionStatus } from "@/types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export async function adminCreateUser(
  idToken: string,
  input: { email: string; password: string; firstName: string; lastName: string }
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const { uid } = await restCreateUser({
      email: input.email,
      password: input.password,
      displayName: `${input.firstName} ${input.lastName}`,
      emailVerified: true,
    });

    const setup = await initializeCustomerAccount({
      uid,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    if (!setup.ok) {
      await restDeleteUser(uid).catch(() => null);
      return { ok: false as const, error: setup.error };
    }

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.createUser",
      targetUserId: uid,
      after: { email: input.email, firstName: input.firstName, lastName: input.lastName },
    });

    return { ok: true as const, uid };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to create user.") };
  }
}

export async function adminSetUserStatus(
  idToken: string,
  userId: string,
  status: "active" | "suspended" | "closed"
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const userRef = getAdminDb().collection(COLLECTIONS.users).doc(userId);
    const before = (await userRef.get()).data();

    await userRef.update({ status, updatedAt: new Date().toISOString() });
    await restSetUserDisabled(userId, status !== "active");

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.setUserStatus",
      targetUserId: userId,
      before: { status: before?.status },
      after: { status },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to update user status.") };
  }
}

export async function adminDeleteUser(idToken: string, userId: string) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const userRef = getAdminDb().collection(COLLECTIONS.users).doc(userId);
    const before = (await userRef.get()).data();

    await restDeleteUser(userId).catch(() => null);
    await userRef.delete();

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.deleteUser",
      targetUserId: userId,
      before: { email: before?.email, firstName: before?.firstName, lastName: before?.lastName },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to delete user.") };
  }
}

const EDITABLE_PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "occupation",
  "dateOfBirth",
  "email",
] as const;

type EditableProfileField = (typeof EDITABLE_PROFILE_FIELDS)[number];

/**
 * The only path that may change a customer's identity/KYC fields - customers
 * cannot change these themselves (see lib/actions/profile-actions.ts's
 * runtime allowlist). Records exactly which fields changed and their old/new
 * values in the audit log, not just a generic before/after blob.
 */
export async function adminUpdateProfile(
  idToken: string,
  userId: string,
  updates: Partial<Record<EditableProfileField, string>>
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const userRef = getAdminDb().collection(COLLECTIONS.users).doc(userId);
    const snap = await userRef.get();
    const before = snap.data();
    if (!before) return { ok: false as const, error: "Customer not found." };

    const changedFields: string[] = [];
    const beforeValues: Record<string, unknown> = {};
    const afterValues: Record<string, unknown> = {};
    const writes: Record<string, unknown> = {};

    for (const field of EDITABLE_PROFILE_FIELDS) {
      const newValue = updates[field];
      if (newValue === undefined) continue;
      const oldValue = (before as Record<string, unknown>)[field] ?? "";
      if (newValue === oldValue) continue;
      changedFields.push(field);
      beforeValues[field] = oldValue;
      afterValues[field] = newValue;
      writes[field] = newValue;
    }

    if (changedFields.length === 0) {
      return { ok: true as const, changedFields: [] as string[] };
    }

    if (changedFields.includes("email")) {
      await restUpdateUserEmail(userId, updates.email!);
    }

    await userRef.update({ ...writes, updatedAt: new Date().toISOString() });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.updateProfile",
      targetUserId: userId,
      changedFields,
      before: beforeValues,
      after: afterValues,
    });

    return { ok: true as const, changedFields };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to update profile.") };
  }
}

export async function adminApproveRegistration(idToken: string, userId: string) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    await getAdminDb()
      .collection(COLLECTIONS.users)
      .doc(userId)
      .update({ reviewStatus: "approved", updatedAt: new Date().toISOString() });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.approveRegistration",
      targetUserId: userId,
      before: { reviewStatus: "pending" },
      after: { reviewStatus: "approved" },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to approve registration.") };
  }
}

export async function adminRejectRegistration(idToken: string, userId: string) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const now = new Date().toISOString();
    await getAdminDb()
      .collection(COLLECTIONS.users)
      .doc(userId)
      .update({ reviewStatus: "rejected", status: "suspended", updatedAt: now });
    await restSetUserDisabled(userId, true);

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.rejectRegistration",
      targetUserId: userId,
      before: { reviewStatus: "pending", status: "active" },
      after: { reviewStatus: "rejected", status: "suspended" },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to reject registration.") };
  }
}

export async function adminAdjustBalance(
  idToken: string,
  input: { accountId: string; amount: number; reason: string }
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

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

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.adjustBalance",
      targetUserId: account.userId,
      before: { accountId: input.accountId, balance: account.balance },
      after: { accountId: input.accountId, amount: input.amount, reason: input.reason },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to adjust balance.") };
  }
}

export async function adminCreateTransaction(
  idToken: string,
  input: { userId: string; accountId: string; amount: number; direction: "credit" | "debit"; description: string }
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

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

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.createTransaction",
      targetUserId: input.userId,
      after: { accountId: input.accountId, amount: input.amount, direction: input.direction, description: input.description },
    });

    return { ok: true as const, id: ref.id };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to create transaction.") };
  }
}

export async function adminReverseTransaction(idToken: string, transactionId: string) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

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

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.reverseTransaction",
      targetUserId: tx.userId,
      before: { transactionId, status: tx.status },
      after: { transactionId, status: "reversed" },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to reverse transaction.") };
  }
}

export async function adminReviewTransfer(idToken: string, transactionId: string, approve: boolean) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

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

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: approve ? "admin.approveTransfer" : "admin.rejectTransfer",
      targetUserId: tx.userId,
      before: { transactionId, status: tx.status },
      after: { transactionId, status: approve ? "completed" : "failed" },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to review transfer.") };
  }
}

export async function adminBroadcastNotification(
  idToken: string,
  input: { title: string; message: string; type: "system" | "promo" | "security" }
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

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

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.broadcastNotification",
      after: { title: input.title, type: input.type },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to broadcast notification.") };
  }
}

export async function adminSendNotification(
  idToken: string,
  input: { userId: string; title: string; message: string; type: "system" | "promo" | "security" }
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    await getAdminDb().collection(COLLECTIONS.notifications).add({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
    });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.sendNotification",
      targetUserId: input.userId,
      after: { title: input.title, type: input.type },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to send notification.") };
  }
}

export async function adminResetTransactionPin(idToken: string, userId: string) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    await getAdminDb()
      .collection(COLLECTIONS.users)
      .doc(userId)
      .update({ transactionPin: FieldValue.delete(), updatedAt: new Date().toISOString() });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.resetTransactionPin",
      targetUserId: userId,
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to reset PIN.") };
  }
}

export async function adminOpenAccount(idToken: string, userId: string, type: AccountType) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const names: Record<AccountType, string> = {
      current: "Current Account",
      savings: "Savings Account",
      fixed_deposit: "Fixed Deposit",
    };

    const ref = getAdminDb().collection(COLLECTIONS.accounts).doc();
    const now = new Date().toISOString();
    await ref.set({
      userId,
      type,
      name: names[type],
      accountNumber: generateAccountNumber(),
      balance: 0,
      currency: "USD",
      status: "active",
      ...(type === "savings" ? { interestRate: 4.5 } : {}),
      ...(type === "fixed_deposit"
        ? { interestRate: 7.2, maturityDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString() }
        : {}),
      createdAt: now,
    });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.openAccount",
      targetUserId: userId,
      after: { accountId: ref.id, type },
    });

    return { ok: true as const, id: ref.id };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to open account.") };
  }
}

export async function adminSetAccountStatus(idToken: string, accountId: string, status: AccountStatus) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const ref = getAdminDb().collection(COLLECTIONS.accounts).doc(accountId);
    const snap = await ref.get();
    const account = snap.data();
    if (!account) return { ok: false as const, error: "Account not found." };

    await ref.update({ status });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.setAccountStatus",
      targetUserId: account.userId,
      before: { accountId, status: account.status ?? "active" },
      after: { accountId, status },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to update account status.") };
  }
}

export async function adminTransferFunds(
  idToken: string,
  input: { fromAccountId: string; toAccountId: string; amount: number; note?: string }
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  if (input.amount <= 0) return { ok: false as const, error: "Enter a valid amount." };
  if (input.fromAccountId === input.toAccountId) {
    return { ok: false as const, error: "Source and destination accounts must differ." };
  }

  try {
    const db = getAdminDb();
    const fromRef = db.collection(COLLECTIONS.accounts).doc(input.fromAccountId);
    const toRef = db.collection(COLLECTIONS.accounts).doc(input.toAccountId);

    const result = await db.runTransaction(async (trx) => {
      const [fromSnap, toSnap] = await Promise.all([trx.get(fromRef), trx.get(toRef)]);
      const from = fromSnap.data();
      const to = toSnap.data();
      if (!from) throw new Error("Source account not found.");
      if (!to) throw new Error("Destination account not found.");
      if (from.balance < input.amount) throw new Error("Insufficient balance in source account.");

      const now = new Date().toISOString();
      const reference = generateReference();

      trx.update(fromRef, { balance: FieldValue.increment(-input.amount) });
      trx.update(toRef, { balance: FieldValue.increment(input.amount) });

      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: from.userId,
        accountId: input.fromAccountId,
        type: "transfer_internal",
        direction: "debit",
        amount: input.amount,
        currency: from.currency ?? "USD",
        status: "completed",
        reference,
        description: input.note || "Admin transfer",
        counterpartyAccount: to.accountNumber,
        createdAt: now,
      });
      trx.set(db.collection(COLLECTIONS.transactions).doc(), {
        userId: to.userId,
        accountId: input.toAccountId,
        type: "transfer_internal",
        direction: "credit",
        amount: input.amount,
        currency: to.currency ?? "USD",
        status: "completed",
        reference,
        description: input.note || "Admin transfer",
        counterpartyAccount: from.accountNumber,
        createdAt: now,
      });

      return { reference, fromUserId: from.userId, toUserId: to.userId };
    });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.transferFunds",
      targetUserId: result.fromUserId,
      after: {
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        toUserId: result.toUserId,
        amount: input.amount,
        reference: result.reference,
      },
    });

    return { ok: true as const, reference: result.reference };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Transfer failed.") };
  }
}

export async function adminIssueCard(
  idToken: string,
  input: { userId: string; accountId: string; type: "virtual" | "physical"; network: "visa" | "mastercard" | "verve"; cardholderName: string }
) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const now = new Date().toISOString();
    const ref = getAdminDb().collection(COLLECTIONS.cards).doc();
    await ref.set({
      userId: input.userId,
      accountId: input.accountId,
      type: input.type,
      network: input.network,
      cardholderName: input.cardholderName.toUpperCase(),
      cardNumber: `4${Math.floor(100000000000000 + Math.random() * 899999999999999)}`,
      expiryMonth: "12",
      expiryYear: String(new Date().getFullYear() + 4),
      cvv: String(Math.floor(100 + Math.random() * 899)),
      pin: "1234",
      status: "active",
      dailyLimit: input.type === "virtual" ? 1000 : 2000,
      monthlyLimit: input.type === "virtual" ? 10000 : 20000,
      color: "from-slate-800 to-slate-600",
      createdAt: now,
    });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.issueCard",
      targetUserId: input.userId,
      after: { cardId: ref.id, type: input.type, network: input.network },
    });

    return { ok: true as const, id: ref.id };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to issue card.") };
  }
}

export async function adminSetCardStatus(idToken: string, cardId: string, status: CardStatus) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const ref = getAdminDb().collection(COLLECTIONS.cards).doc(cardId);
    const snap = await ref.get();
    const card = snap.data();
    if (!card) return { ok: false as const, error: "Card not found." };

    await ref.update({ status });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.setCardStatus",
      targetUserId: card.userId,
      before: { cardId, status: card.status },
      after: { cardId, status },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to update card.") };
  }
}

export async function adminReplaceCard(idToken: string, cardId: string) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const ref = getAdminDb().collection(COLLECTIONS.cards).doc(cardId);
    const snap = await ref.get();
    const card = snap.data();
    if (!card) return { ok: false as const, error: "Card not found." };

    const newCardNumber = `4${Math.floor(100000000000000 + Math.random() * 899999999999999)}`;
    await ref.update({
      cardNumber: newCardNumber,
      cvv: String(Math.floor(100 + Math.random() * 899)),
      status: "active",
      expiryYear: String(new Date().getFullYear() + 4),
    });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.replaceCard",
      targetUserId: card.userId,
      before: { cardId },
      after: { cardId },
    });

    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to replace card.") };
  }
}

const EDITABLE_TRANSACTION_FIELDS = [
  "customerName",
  "createdAt",
  "description",
  "amount",
  "currency",
  "status",
  "category",
  "reference",
] as const;

type EditableTransactionField = (typeof EDITABLE_TRANSACTION_FIELDS)[number];

export type TransactionEdit = Partial<{
  customerName: string;
  createdAt: string;
  description: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  category: string;
  reference: string;
}>;

/** The four statuses the edit UI exposes - the type also allows "scheduled"/"reversed", set only by other flows (transfer review, reversal). */
const EDITABLE_STATUSES: TransactionStatus[] = ["pending", "completed", "failed", "cancelled"];
const CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));

function validateTransactionEdit(updates: TransactionEdit): string | null {
  if (updates.amount !== undefined && (!Number.isFinite(updates.amount) || updates.amount <= 0)) {
    return "Amount must be a positive number.";
  }
  if (updates.currency !== undefined && !CURRENCY_CODES.has(updates.currency)) {
    return "Unsupported currency code.";
  }
  if (updates.status !== undefined && !EDITABLE_STATUSES.includes(updates.status)) {
    return "Status must be one of: pending, completed, failed, cancelled.";
  }
  if (updates.createdAt !== undefined && Number.isNaN(new Date(updates.createdAt).getTime())) {
    return "Invalid transaction date/time.";
  }
  if (updates.reference !== undefined && updates.reference.trim().length === 0) {
    return "Reference number cannot be empty.";
  }
  if (updates.description !== undefined && updates.description.trim().length === 0) {
    return "Description cannot be empty.";
  }
  if (updates.customerName !== undefined && updates.customerName.trim().length === 0) {
    return "Customer name cannot be empty.";
  }
  return null;
}

/**
 * Corrects a transaction record's own fields (a data-entry fix), diffing and
 * audit-logging only what actually changed - mirrors adminUpdateProfile's
 * pattern. This never touches account balances or reassigns the owning
 * userId/accountId: editing amount/currency/status here fixes what the
 * record *says*, it does not re-run money movement. `customerName` is a
 * display label independent of the real owner, for the same reason.
 */
export async function adminEditTransaction(idToken: string, transactionId: string, updates: TransactionEdit) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  const validationError = validateTransactionEdit(updates);
  if (validationError) return { ok: false as const, error: validationError };

  try {
    const txRef = getAdminDb().collection(COLLECTIONS.transactions).doc(transactionId);
    const snap = await txRef.get();
    const before = snap.data();
    if (!before) return { ok: false as const, error: "Transaction not found." };

    const changedFields: string[] = [];
    const beforeValues: Record<string, unknown> = {};
    const afterValues: Record<string, unknown> = {};
    const writes: Record<string, unknown> = {};

    for (const field of EDITABLE_TRANSACTION_FIELDS) {
      const newValue = updates[field as EditableTransactionField];
      if (newValue === undefined) continue;
      const oldValue = (before as Record<string, unknown>)[field] ?? null;
      if (newValue === oldValue) continue;
      changedFields.push(field);
      beforeValues[field] = oldValue;
      afterValues[field] = newValue;
      writes[field] = newValue;
    }

    if (changedFields.length === 0) {
      return { ok: true as const, changedFields: [] as string[] };
    }

    await txRef.update(writes);

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.editTransaction",
      targetUserId: before.userId,
      targetId: transactionId,
      changedFields,
      before: beforeValues,
      after: afterValues,
    });

    return { ok: true as const, changedFields };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to update transaction.") };
  }
}

/**
 * Reverts the single most recent not-yet-undone admin.editTransaction entry
 * by writing its recorded `before` values back onto the transaction, then
 * marks that entry undone (so it can't be undone twice) and logs the revert
 * itself as a new audit entry for full traceability. Scans a bounded page of
 * recent logs ordered by createdAt (single-field, no composite index) rather
 * than filtering by action server-side, since auditLogs has no
 * action+createdAt composite index deployed.
 */
export async function adminUndoLastTransactionEdit(idToken: string) {
  const admin = await requireAdmin(idToken);
  if (!admin.ok) return admin;

  try {
    const db = getAdminDb();
    const recent = await db.collection(COLLECTIONS.auditLogs).orderBy("createdAt", "desc").limit(50).get();

    const target = recent.docs.find(
      (d) => d.data().action === "admin.editTransaction" && d.data().undone !== true
    );
    if (!target) {
      return { ok: false as const, error: "No transaction edit to undo." };
    }

    const entry = target.data();
    const transactionId = entry.targetId as string | undefined;
    if (!transactionId) {
      return { ok: false as const, error: "That edit has no recorded transaction to restore." };
    }

    const txRef = db.collection(COLLECTIONS.transactions).doc(transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) {
      return { ok: false as const, error: "The edited transaction no longer exists." };
    }

    const restoreValues = (entry.before ?? {}) as Record<string, unknown>;
    await txRef.update(restoreValues);
    await target.ref.update({ undone: true });

    await writeAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: "admin.undoEditTransaction",
      targetUserId: entry.targetUserId ?? undefined,
      targetId: transactionId,
      changedFields: entry.changedFields ?? [],
      before: entry.after,
      after: entry.before,
    });

    return { ok: true as const, transactionId };
  } catch (e) {
    return { ok: false as const, error: errorMessage(e, "Failed to undo the last edit.") };
  }
}
