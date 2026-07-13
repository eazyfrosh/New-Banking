"use server";

import { getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { CardStatus } from "@/types";

async function assertOwnership(cardId: string, userId: string) {
  const snap = await getAdminDb().collection(COLLECTIONS.cards).doc(cardId).get();
  const card = snap.data();
  if (!card || card.userId !== userId) throw new Error("Card not found.");
  return card;
}

export async function setCardStatus(cardId: string, userId: string, status: CardStatus) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  try {
    await assertOwnership(cardId, userId);
    await getAdminDb().collection(COLLECTIONS.cards).doc(cardId).update({ status });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to update card." };
  }
}

export async function updateCardLimits(
  cardId: string,
  userId: string,
  limits: { dailyLimit: number; monthlyLimit: number }
) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  try {
    await assertOwnership(cardId, userId);
    await getAdminDb().collection(COLLECTIONS.cards).doc(cardId).update(limits);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to update limits." };
  }
}

export async function replaceCard(cardId: string, userId: string) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
  try {
    const card = await assertOwnership(cardId, userId);
    const newCardNumber = `4${Math.floor(100000000000000 + Math.random() * 899999999999999)}`;
    const newCvv = String(Math.floor(100 + Math.random() * 899));
    await getAdminDb().collection(COLLECTIONS.cards).doc(cardId).update({
      cardNumber: newCardNumber,
      cvv: newCvv,
      status: "active",
      expiryYear: String(new Date().getFullYear() + 4),
    });
    return { ok: true as const, network: card.network };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to replace card." };
  }
}

export async function createCard(input: {
  userId: string;
  accountId: string;
  type: "virtual" | "physical";
  network: "visa" | "mastercard" | "verve";
  cardholderName: string;
}) {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false as const, error: `Server is not configured: ${adminError}` };
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
  return { ok: true as const, id: ref.id };
}
