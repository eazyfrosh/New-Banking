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

interface CustomerProfileUpdate {
  currency?: string;
  language?: string;
  notificationPrefs?: { email: boolean; push: boolean; sms: boolean };
}

/**
 * Customers may only change their own preferences here (currency, language,
 * notification channels) - never identity/KYC fields (name, date of birth,
 * phone, address, occupation, photo). Only the admin portal's
 * adminUpdateProfile can change those, since they must be verifiable and
 * audited. The allowlist check below is a runtime check, not just a
 * TypeScript type: a manually crafted request bypasses the type system
 * entirely, so this is the actual enforcement boundary.
 */
export async function updateProfileDetails(userId: string, data: CustomerProfileUpdate) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };

  const allowed = new Set(["currency", "language", "notificationPrefs"]);
  const disallowed = Object.keys(data as Record<string, unknown>).filter((key) => !allowed.has(key));
  if (disallowed.length > 0) {
    return {
      ok: false as const,
      error: `You cannot update: ${disallowed.join(", ")}. Contact an administrator to change identity or KYC details.`,
    };
  }

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
