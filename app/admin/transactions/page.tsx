"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";

import { useAllAccounts, useAllTransactions, useAllUsers } from "@/hooks/use-admin-data";
import { transactionLabels, statusColors } from "@/lib/transaction-meta";
import { CURRENCIES } from "@/lib/currencies";
import { formatCurrency, formatDate } from "@/lib/utils";

import { CreateTransactionDialog } from "@/components/admin/transactions/create-transaction-dialog";
import { EditTransactionDialog } from "@/components/admin/transactions/edit-transaction-dialog";
import { TransactionRowActions } from "@/components/admin/transactions/transaction-row-actions";
import { TransactionReceiptDialog } from "@/components/shared/transaction-receipt-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction, TransactionStatus, TransactionType, UserProfile, Account } from "@/types";

const PAGE_SIZE = 15;
const TRANSACTION_TYPES = Object.keys(transactionLabels) as TransactionType[];
const STATUSES: TransactionStatus[] = ["pending", "completed", "failed", "cancelled", "scheduled", "reversed"];

export default function AdminTransactionsPage() {
  const { data: transactions, isLoading } = useAllTransactions();
  const { data: users } = useAllUsers();
  const { data: accounts } = useAllAccounts();

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TransactionStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<TransactionType | "all">("all");
  const [currencyFilter, setCurrencyFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [amountMin, setAmountMin] = React.useState("");
  const [amountMax, setAmountMax] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);

  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null);

  const usersById = React.useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of users ?? []) map.set(u.uid, u);
    return map;
  }, [users]);

  const accountsById = React.useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of accounts ?? []) map.set(a.id, a);
    return map;
  }, [accounts]);

  const customerNameFor = React.useCallback(
    (tx: Transaction) => {
      if (tx.customerName) return tx.customerName;
      const u = usersById.get(tx.userId);
      return u ? `${u.firstName} ${u.lastName}` : "";
    },
    [usersById]
  );

  const filtered = React.useMemo(() => {
    let result = transactions ?? [];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter((tx) => {
        const u = usersById.get(tx.userId);
        const account = accountsById.get(tx.accountId);
        return (
          tx.id.toLowerCase().includes(q) ||
          tx.reference.toLowerCase().includes(q) ||
          tx.description.toLowerCase().includes(q) ||
          customerNameFor(tx).toLowerCase().includes(q) ||
          (u?.email ?? "").toLowerCase().includes(q) ||
          (account?.accountNumber ?? "").toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== "all") result = result.filter((tx) => tx.status === statusFilter);
    if (typeFilter !== "all") result = result.filter((tx) => tx.type === typeFilter);
    if (currencyFilter !== "all") result = result.filter((tx) => tx.currency === currencyFilter);
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((tx) => new Date(tx.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86_400_000 - 1;
      result = result.filter((tx) => new Date(tx.createdAt).getTime() <= to);
    }
    if (amountMin) result = result.filter((tx) => tx.amount >= Number(amountMin));
    if (amountMax) result = result.filter((tx) => tx.amount <= Number(amountMax));

    return [...result].sort((a, b) => {
      const diff =
        sortBy === "amount"
          ? a.amount - b.amount
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [
    transactions,
    usersById,
    accountsById,
    customerNameFor,
    query,
    statusFilter,
    typeFilter,
    currencyFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    sortBy,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasActiveFilters =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    currencyFilter !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    !!amountMin ||
    !!amountMax ||
    !!query;

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCurrencyFilter("all");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Search, filter, edit and manage every transaction platform-wide.
          </p>
        </div>
        <CreateTransactionDialog />
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search name, email, account #, reference, or transaction ID..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as typeof statusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as typeof typeFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {transactionLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currencyFilter}
            onValueChange={(v) => {
              setCurrencyFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All currencies</SelectItem>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by date</SelectItem>
              <SelectItem value="amount">Sort by amount</SelectItem>
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">From</span>
            <Input
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">To</span>
            <Input
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Min amount</span>
            <Input
              type="number"
              className="w-28"
              value={amountMin}
              onChange={(e) => {
                setAmountMin(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Max amount</span>
            <Input
              type="number"
              className="w-28"
              value={amountMax}
              onChange={(e) => {
                setAmountMax(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : paginated.length === 0 ? (
        <EmptyState icon={Search} title="No transactions found" description="Try adjusting your search or filters." />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <TableCell className="font-medium">{customerNameFor(tx) || "—"}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-muted-foreground">{transactionLabels[tx.type]}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</TableCell>
                  <TableCell className={tx.direction === "credit" ? "text-success" : ""}>
                    {tx.direction === "credit" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[tx.status] ?? "outline"} className="capitalize">
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <TransactionRowActions transaction={tx} onEdit={setEditingTx} />
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

      <EditTransactionDialog
        transaction={editingTx}
        defaultCustomerName={editingTx ? customerNameFor(editingTx) : undefined}
        onOpenChange={(open) => !open && setEditingTx(null)}
      />
    </div>
  );
}
