import { orderBy, where } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany, subscribeMany } from "@/lib/services/firestore-helpers";
import type { Investment } from "@/types";

export function listInvestments(userId: string) {
  return getMany<Investment>(
    COLLECTIONS.investments,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
}

export function subscribeInvestments(
  userId: string,
  cb: (items: Investment[]) => void,
  onError?: (e: Error) => void
) {
  return subscribeMany<Investment>(
    COLLECTIONS.investments,
    [where("userId", "==", userId), orderBy("createdAt", "desc")],
    cb,
    onError
  );
}

export function investmentValue(inv: Investment) {
  return inv.units * inv.currentPrice;
}

export function investmentCost(inv: Investment) {
  return inv.units * inv.avgBuyPrice;
}

export function investmentPnL(inv: Investment) {
  const value = investmentValue(inv);
  const cost = investmentCost(inv);
  return { amount: value - cost, percent: cost ? ((value - cost) / cost) * 100 : 0 };
}
