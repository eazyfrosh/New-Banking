"use client";

import { useRealtimeCollection } from "@/hooks/use-realtime-collection";
import { subscribeSavingsPlans } from "@/lib/services/savings";
import type { SavingsPlan } from "@/types";

export function useSavingsPlans(userId: string | undefined) {
  return useRealtimeCollection<SavingsPlan>(userId, subscribeSavingsPlans);
}
