import {
  limit as fsLimit,
  orderBy,
  where,
  type QueryConstraint,
} from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany, subscribeMany } from "@/lib/services/firestore-helpers";
import type { Transaction } from "@/types";

export function listTransactions(userId: string, take?: number) {
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  ];
  if (take) constraints.push(fsLimit(take));
  return getMany<Transaction>(COLLECTIONS.transactions, ...constraints);
}

export function subscribeTransactions(
  userId: string,
  cb: (items: Transaction[]) => void,
  onError?: (e: Error) => void
) {
  return subscribeMany<Transaction>(
    COLLECTIONS.transactions,
    [where("userId", "==", userId), orderBy("createdAt", "desc")],
    cb,
    onError
  );
}

export function listAllTransactions(take = 200) {
  return getMany<Transaction>(
    COLLECTIONS.transactions,
    orderBy("createdAt", "desc"),
    fsLimit(take)
  );
}
