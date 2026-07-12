import type { Metadata } from "next";

import { TransactionsExplorer } from "@/components/dashboard/transactions/transactions-explorer";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search, filter and export your full transaction history.
        </p>
      </div>
      <TransactionsExplorer />
    </div>
  );
}
