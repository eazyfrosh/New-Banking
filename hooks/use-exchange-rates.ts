"use client";

import { useQuery } from "@tanstack/react-query";

import { getExchangeRates } from "@/lib/actions/currency-actions";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

export function useExchangeRates(base: string = DEFAULT_CURRENCY) {
  return useQuery({
    queryKey: ["exchange-rates", base],
    queryFn: () => getExchangeRates(base),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
