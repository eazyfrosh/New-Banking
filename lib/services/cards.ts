import { orderBy, where } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany, subscribeMany } from "@/lib/services/firestore-helpers";
import type { BankCard } from "@/types";

export function listCards(userId: string) {
  return getMany<BankCard>(
    COLLECTIONS.cards,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
}

export function subscribeCards(
  userId: string,
  cb: (items: BankCard[]) => void,
  onError?: (e: Error) => void
) {
  return subscribeMany<BankCard>(
    COLLECTIONS.cards,
    [where("userId", "==", userId), orderBy("createdAt", "desc")],
    cb,
    onError
  );
}

/** Admin-wide read across every customer's cards. Single-field orderBy only (no where) so it never needs a composite index. */
export function listAllCards() {
  return getMany<BankCard>(COLLECTIONS.cards, orderBy("createdAt", "desc"));
}
