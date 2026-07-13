"use server";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { hashSecret } from "@/lib/actions/crypto";

export async function setTransactionPin(userId: string, pin: string) {
  if (!isAdminConfigured || !adminDb) return { ok: false as const, error: "Server is not configured." };
  if (!/^\d{4}$/.test(pin)) return { ok: false as const, error: "PIN must be 4 digits." };

  await adminDb.collection(COLLECTIONS.users).doc(userId).update({
    transactionPin: hashSecret(pin),
    updatedAt: new Date().toISOString(),
  });

  return { ok: true as const };
}

export async function updateProfileDetails(
  userId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    currency: string;
    language: string;
    photoURL: string;
    notificationPrefs: { email: boolean; push: boolean; sms: boolean };
  }>
) {
  if (!isAdminConfigured || !adminDb) return { ok: false as const, error: "Server is not configured." };

  await adminDb.collection(COLLECTIONS.users).doc(userId).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true as const };
}
