import { orderBy, where } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany, subscribeMany } from "@/lib/services/firestore-helpers";
import type { Account } from "@/types";

export function listAccounts(userId: string) {
  return getMany<Account>(
    COLLECTIONS.accounts,
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );
}

export function subscribeAccounts(
  userId: string,
  cb: (accounts: Account[]) => void,
  onError?: (e: Error) => void
) {
  return subscribeMany<Account>(
    COLLECTIONS.accounts,
    [where("userId", "==", userId), orderBy("createdAt", "asc")],
    cb,
    onError
  );
}
