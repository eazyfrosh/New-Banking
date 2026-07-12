"use client";

import { useQuery } from "@tanstack/react-query";

import { listAllUsers, listFraudAlerts, listSupportTickets } from "@/lib/services/admin";
import { listAllTransactions } from "@/lib/services/transactions";
import { listAllLoans } from "@/lib/services/loans";

export function useAllUsers() {
  return useQuery({ queryKey: ["admin", "users"], queryFn: listAllUsers });
}

export function useAllTransactions(take = 200) {
  return useQuery({
    queryKey: ["admin", "transactions", take],
    queryFn: () => listAllTransactions(take),
  });
}

export function useAllLoans() {
  return useQuery({ queryKey: ["admin", "loans"], queryFn: listAllLoans });
}

export function useSupportTickets() {
  return useQuery({ queryKey: ["admin", "tickets"], queryFn: listSupportTickets });
}

export function useFraudAlerts() {
  return useQuery({ queryKey: ["admin", "fraud-alerts"], queryFn: listFraudAlerts });
}
