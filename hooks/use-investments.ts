"use client";

import { useRealtimeCollection } from "@/hooks/use-realtime-collection";
import { listInvestments, subscribeInvestments } from "@/lib/services/investments";
import type { Investment } from "@/types";

export function useInvestments(userId: string | undefined) {
  return useRealtimeCollection<Investment>(userId, subscribeInvestments, listInvestments);
}
