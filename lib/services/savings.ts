import { orderBy, where } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany, subscribeMany } from "@/lib/services/firestore-helpers";
import type { SavingsPlan } from "@/types";

export function listSavingsPlans(userId: string) {
  return getMany<SavingsPlan>(
    COLLECTIONS.savingsPlans,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
}

export function subscribeSavingsPlans(
  userId: string,
  cb: (items: SavingsPlan[]) => void,
  onError?: (e: Error) => void
) {
  return subscribeMany<SavingsPlan>(
    COLLECTIONS.savingsPlans,
    [where("userId", "==", userId), orderBy("createdAt", "desc")],
    cb,
    onError
  );
}
