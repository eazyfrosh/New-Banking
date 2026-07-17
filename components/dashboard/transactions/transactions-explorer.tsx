"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Download, FileText, Receipt, Search } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useTransactions } from "@/hooks/use-transactions";
import { exportTransactionsToCsv, exportTransactionsToPdf } from "@/lib/export";
import { transactionLabels, statusColors } from "@/lib/transaction-meta";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";

import { TransactionReceiptDialog } from "@/components/shared/transaction-receipt-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

const statusFilters: (TransactionStatus | "all")[] = [
  "all",
  "completed",
  "pending",
  "failed",
  "cancelled",
  "scheduled",
  "reversed",
];

const PAGE_SIZE = 10;

export function TransactionsExplorer() {
  const { profile } = useAuth();
  const { data: transactions, loading } = useTransactions(profile?.uid);

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<TransactionStatus | "all">("all");
  const [direction, setDirection] = React.useState<"all" | "credit" | "debit">("all");
  const [sortDir, setSortDir] = React.useState<"desc" | "asc">("desc");
  const [page, setPage] = React.useState(1);
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  const filtered = React.useMemo(() => {
    let result: Transaction[] = transactions;

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (tx) => tx.description.toLowerCase().includes(q) || tx.reference.toLowerCase().includes(q)
      );
    }
    if (status !== "all") {
      result = result.filter((tx) => tx.status === status);
    }
    if (direction !== "all") {
      result = result.filter((tx) => tx.direction === direction);
    }

    return [...result].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [transactions, query, status, direction, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search description or reference..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as TransactionStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={direction}
          onValueChange={(v) => {
            setDirection(v as typeof direction);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="credit">Credits</SelectItem>
            <SelectItem value="debit">Debits</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          aria-label="Toggle sort order"
        >
          {sortDir === "desc" ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
        </Button>

        <Button variant="outline" onClick={() => exportTransactionsToCsv(filtered)}>
          <Download className="size-4" />
          CSV
        </Button>
        <Button variant="outline" onClick={() => exportTransactionsToPdf(filtered)}>
          <FileText className="size-4" />
          PDF
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description="Try adjusting your search or filters."
        />
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
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {transactionLabels[tx.type]}
                  </TableCell>
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
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {tx.reference}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages} &middot; {filtered.length} results
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <TransactionReceiptDialog
        transaction={selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      />
    </div>
  );
}
