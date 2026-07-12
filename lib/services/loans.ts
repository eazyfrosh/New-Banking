import { orderBy, where } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMany, subscribeMany } from "@/lib/services/firestore-helpers";
import type { Loan } from "@/types";

export function listLoans(userId: string) {
  return getMany<Loan>(
    COLLECTIONS.loans,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
}

export function subscribeLoans(
  userId: string,
  cb: (items: Loan[]) => void,
  onError?: (e: Error) => void
) {
  return subscribeMany<Loan>(
    COLLECTIONS.loans,
    [where("userId", "==", userId), orderBy("createdAt", "desc")],
    cb,
    onError
  );
}

export function listAllLoans() {
  return getMany<Loan>(COLLECTIONS.loans, orderBy("createdAt", "desc"));
}

export function calculateMonthlyRepayment(
  principal: number,
  annualRatePct: number,
  termMonths: number
) {
  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function buildRepaymentSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  startDate: Date
) {
  const monthlyRate = annualRatePct / 100 / 12;
  const payment = calculateMonthlyRepayment(principal, annualRatePct, termMonths);
  let balance = principal;
  const schedule = [];

  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPortion = payment - interest;
    balance = Math.max(0, balance - principalPortion);
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installment: i,
      dueDate: dueDate.toISOString(),
      amount: payment,
      principal: principalPortion,
      interest,
      status: "upcoming" as const,
    });
  }

  return schedule;
}
