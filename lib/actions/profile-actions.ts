"use server";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { hashSecret } from "@/lib/actions/crypto";

export async function setTransactionPin(userId: string, pin: string) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  if (!/^\d{4}$/.test(pin)) return { ok: false as const, error: "PIN must be 4 digits." };

  try {
    await getAdminDb().collection(COLLECTIONS.users).doc(userId).update({
      transactionPin: hashSecret(pin),
      updatedAt: new Date().toISOString(),
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to set PIN." };
  }
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
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };

  try {
    await getAdminDb().collection(COLLECTIONS.users).doc(userId).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to update profile." };
  }
}
