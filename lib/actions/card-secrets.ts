"use server";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { verifySecret } from "@/lib/actions/crypto";
import { checkAndRecordAttempt, resetAttempts } from "@/lib/actions/rate-limit";

export async function revealCardDetails(input: {
  cardId: string;
  userId: string;
  pin: string;
}) {
  if (!isAdminConfigured || !adminDb) {
    return { ok: false as const, error: "Server is not configured." };
  }

  const attemptKey = `card-pin:${input.userId}`;
  const attempt = await checkAndRecordAttempt(attemptKey);
  if (!attempt.allowed) {
    return { ok: false as const, error: "Too many attempts. Try again in 15 minutes." };
  }

  const userSnap = await adminDb.collection(COLLECTIONS.users).doc(input.userId).get();
  const user = userSnap.data();

  if (!user?.transactionPin) {
    return { ok: false as const, error: "Set up a transaction PIN in Security Settings first." };
  }
  if (!verifySecret(input.pin, user.transactionPin)) {
    return { ok: false as const, error: `Incorrect PIN. ${attempt.remaining} attempts remaining.` };
  }

  await resetAttempts(attemptKey);

  const cardSnap = await adminDb.collection(COLLECTIONS.cards).doc(input.cardId).get();
  const card = cardSnap.data();
  if (!card || card.userId !== input.userId) {
    return { ok: false as const, error: "Card not found." };
  }

  return { ok: true as const, cardNumber: card.cardNumber, cvv: card.cvv, pin: card.pin };
}
