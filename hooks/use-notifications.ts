"use client";

import { useRealtimeCollection } from "@/hooks/use-realtime-collection";
import { subscribeNotifications } from "@/lib/services/notifications";
import type { AppNotification } from "@/types";

export function useNotifications(userId: string | undefined) {
  const { data, loading, error } = useRealtimeCollection<AppNotification>(
    userId,
    subscribeNotifications
  );

  const active = data.filter((n) => !n.archived);
  const unreadCount = active.filter((n) => !n.read).length;

  return { notifications: active, unreadCount, loading, error };
}
