import { orderBy, where } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  getMany,
  subscribeMany,
  updateDocById,
} from "@/lib/services/firestore-helpers";
import type { AppNotification } from "@/types";

export function listNotifications(userId: string) {
  return getMany<AppNotification>(
    COLLECTIONS.notifications,
    where("userId", "in", [userId, "all"]),
    orderBy("createdAt", "desc")
  );
}

export function subscribeNotifications(
  userId: string,
  cb: (items: AppNotification[]) => void,
  onError?: (e: Error) => void
) {
  return subscribeMany<AppNotification>(
    COLLECTIONS.notifications,
    [where("userId", "in", [userId, "all"]), orderBy("createdAt", "desc")],
    cb,
    onError
  );
}

export function markNotificationRead(id: string) {
  return updateDocById(COLLECTIONS.notifications, id, { read: true });
}

export function archiveNotification(id: string) {
  return updateDocById(COLLECTIONS.notifications, id, { archived: true });
}
