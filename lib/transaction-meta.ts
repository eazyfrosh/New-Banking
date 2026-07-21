import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Landmark,
  LineChart,
  type LucideIcon,
  Receipt,
  Repeat,
  Wallet,
} from "lucide-react";

import type { TransactionStatus, TransactionType } from "@/types";

export const transactionIcons: Record<TransactionType, LucideIcon> = {
  transfer_internal: ArrowLeftRight,
  transfer_bank: Landmark,
  transfer_international: Landmark,
  bill_payment: Receipt,
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  loan_disbursement: Banknote,
  loan_repayment: Banknote,
  investment: LineChart,
  card_payment: Wallet,
  interest: Banknote,
  currency_conversion: Repeat,
};

export const transactionLabels: Record<TransactionType, string> = {
  transfer_internal: "Internal transfer",
  transfer_bank: "Bank transfer",
  transfer_international: "International transfer",
  bill_payment: "Bill payment",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  loan_disbursement: "Loan disbursement",
  loan_repayment: "Loan repayment",
  investment: "Investment",
  card_payment: "Card payment",
  interest: "Interest earned",
  currency_conversion: "Currency conversion",
};

export const statusColors: Record<
  TransactionStatus,
  "warning" | "success" | "destructive" | "outline" | "secondary"
> = {
  pending: "warning",
  completed: "success",
  failed: "destructive",
  cancelled: "secondary",
  scheduled: "outline",
  reversed: "secondary",
};
