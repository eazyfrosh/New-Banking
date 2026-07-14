"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useAllTransactions } from "@/hooks/use-admin-data";
import { transactionLabels, statusColors } from "@/lib/transaction-meta";
import { formatCurrency, formatDate } from "@/lib/utils";

import { CreateTransactionDialog } from "@/components/admin/transactions/create-transaction-dialog";
import { TransactionRowActions } from "@/components/admin/transactions/transaction-row-actions";
import { TransactionReceiptDialog } from "@/components/shared/transaction-receipt-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/types";

export default function AdminTransactionsPage() {
  const { data: transactions, isLoading } = useAllTransactions();
  const [query, setQuery] = React.useState("");
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  const filtered = (transactions ?? []).filter(
    (tx) =>
      tx.description.toLowerCase().includes(query.toLowerCase()) ||
      tx.reference.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review, approve and manage transactions platform-wide.
          </p>
        </div>
        <CreateTransactionDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search transactions..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((tx) => (
                <TableRow
                  key={tx.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell className="text-muted-foreground">{transactionLabels[tx.type]}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                  <TableCell className={tx.direction === "credit" ? "text-success" : ""}>
                    {tx.direction === "credit" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[tx.status]} className="capitalize">
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <TransactionRowActions transaction={tx} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TransactionReceiptDialog
        transaction={selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      />
    </div>
  );
}
