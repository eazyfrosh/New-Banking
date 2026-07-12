"use client";

import { useRealtimeCollection } from "@/hooks/use-realtime-collection";
import { subscribeTransactions } from "@/lib/services/transactions";
import type { Transaction } from "@/types";

export function useTransactions(userId: string | undefined) {
  return useRealtimeCollection<Transaction>(userId, subscribeTransactions);
}
