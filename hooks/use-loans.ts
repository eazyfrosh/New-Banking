"use client";

import { useRealtimeCollection } from "@/hooks/use-realtime-collection";
import { subscribeLoans } from "@/lib/services/loans";
import type { Loan } from "@/types";

export function useLoans(userId: string | undefined) {
  return useRealtimeCollection<Loan>(userId, subscribeLoans);
}
