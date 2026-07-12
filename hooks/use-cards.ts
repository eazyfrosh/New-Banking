"use client";

import { useRealtimeCollection } from "@/hooks/use-realtime-collection";
import { subscribeCards } from "@/lib/services/cards";
import type { BankCard } from "@/types";

export function useCards(userId: string | undefined) {
  return useRealtimeCollection<BankCard>(userId, subscribeCards);
}
