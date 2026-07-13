"use client";

import { useRealtimeCollection } from "@/hooks/use-realtime-collection";
import { listAccounts, subscribeAccounts } from "@/lib/services/accounts";
import type { Account } from "@/types";

export function useAccounts(userId: string | undefined) {
  return useRealtimeCollection<Account>(userId, subscribeAccounts, listAccounts);
}
