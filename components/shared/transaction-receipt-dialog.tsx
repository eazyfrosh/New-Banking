"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Printer,
  Share2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getOne } from "@/lib/services/firestore-helpers";
import { listTransactions } from "@/lib/services/transactions";
import { exportReceiptToPdf } from "@/lib/export";
import { transactionLabels, statusColors } from "@/lib/transaction-meta";
import { cn, formatCurrency, formatDate, maskAccountNumber } from "@/lib/utils";
import type { Account, Transaction, UserProfile } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionReceiptDialogProps {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
}

function useLazyProfile(uid: string | undefined, currentProfile: UserProfile | null) {
  const known = currentProfile?.uid === uid ? currentProfile : undefined;
  return useQuery({
    queryKey: ["receipt", "profile", uid],
    queryFn: () => getOne<UserProfile>(COLLECTIONS.users, uid!),
    enabled: !!uid && !known,
    initialData: known,
  });
}

function useLazyAccount(accountId: string | undefined) {
  return useQuery({
    queryKey: ["receipt", "account", accountId],
    queryFn: () => getOne<Account>(COLLECTIONS.accounts, accountId!),
    enabled: !!accountId,
  });
}

/**
 * "Balance after" only has an unconditionally correct answer for an
 * account's single most-recent transaction - it's just the account's
 * current balance. For any older transaction it would require replaying
 * every transaction since, which isn't safe to assume starts from zero
 * (accounts created before the zero-balance default had a nonzero seeded
 * starting balance that was never itself recorded as a transaction). So
 * this only returns a value for the latest transaction on the account,
 * and undefined otherwise - matching "(if available)".
 */
function useIsLatestForAccount(transaction: Transaction | null) {
  return useQuery({
    queryKey: ["receipt", "latest-for-account", transaction?.userId, transaction?.accountId, transaction?.id],
    queryFn: async () => {
      const all = await listTransactions(transaction!.userId);
      const forAccount = all.filter((t) => t.accountId === transaction!.accountId);
      if (forAccount.length === 0) return false;
      const latest = forAccount.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
      return latest.id === transaction!.id;
    },
    enabled: !!transaction,
  });
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="receipt-no-print hover:bg-muted/60 flex items-center gap-1 rounded-md px-1 -mx-1 text-left transition-colors"
    >
      <span className="font-mono text-sm">{value}</span>
      {copied ? (
        <Check className="text-success size-3.5 shrink-0" />
      ) : (
        <Copy className="text-muted-foreground size-3.5 shrink-0" />
      )}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium break-words">{value}</span>
    </div>
  );
}

const statusIcon: Record<Transaction["status"], typeof CheckCircle2> = {
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: XCircle,
  pending: Circle,
  scheduled: Circle,
  reversed: CheckCircle2,
};

const FAILED_STATUSES = new Set<Transaction["status"]>(["failed", "cancelled"]);
const TERMINAL_STATUSES = new Set<Transaction["status"]>(["completed", "failed", "cancelled", "reversed"]);

function StatusTimeline({ status }: { status: Transaction["status"] }) {
  const isTerminal = TERMINAL_STATUSES.has(status);
  const finalLabel =
    status === "failed"
      ? "Failed"
      : status === "cancelled"
        ? "Cancelled"
        : status === "reversed"
          ? "Reversed"
          : "Completed";
  const steps = [
    { key: "created", label: "Created", done: true },
    { key: "processing", label: "Processing", done: true },
    { key: "final", label: finalLabel, done: isTerminal },
  ];

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const Icon = step.key === "final" ? statusIcon[status] : step.done ? CheckCircle2 : Circle;
        const isFailed = step.key === "final" && FAILED_STATUSES.has(status);
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5">
              <Icon
                className={cn(
                  "size-5",
                  step.done ? (isFailed ? "text-destructive" : "text-success") : "text-muted-foreground/40"
                )}
              />
              <span
                className={cn(
                  "text-[11px] whitespace-nowrap",
                  step.done ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded-full",
                  steps[i + 1].done ? "bg-success/60" : "bg-muted-foreground/20"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function TransactionReceiptDialog({ transaction, onOpenChange }: TransactionReceiptDialogProps) {
  const { profile: myProfile } = useAuth();

  const isCredit = transaction?.direction === "credit";
  // Whoever the transaction document belongs to is the "other side" of the
  // money movement from the counterparty's perspective: on a debit, the doc
  // owner sent the money (sender); on a credit, they received it (recipient).
  const ownerRole = isCredit ? "recipient" : "sender";

  const { data: ownerProfile, isLoading: ownerLoading } = useLazyProfile(transaction?.userId, myProfile);
  const { data: account, isLoading: accountLoading } = useLazyAccount(transaction?.accountId);
  const { data: isLatest } = useIsLatestForAccount(transaction);

  const loading = ownerLoading || accountLoading;
  const balanceAfter = isLatest && account ? account.balance : undefined;

  const ownerName = ownerProfile ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : undefined;
  const senderName = ownerRole === "sender" ? ownerName : transaction?.counterparty;
  const recipientName = ownerRole === "recipient" ? ownerName : transaction?.counterparty;
  const senderAccount = ownerRole === "sender" ? account?.accountNumber : undefined;
  const recipientAccount =
    ownerRole === "recipient" ? account?.accountNumber : transaction?.counterpartyAccount;

  function handleDownloadPdf() {
    if (!transaction) return;
    exportReceiptToPdf(transaction, { senderName, recipientName });
  }

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    if (!transaction) return;
    const text = `${transactionLabels[transaction.type]} · ${formatCurrency(transaction.amount, transaction.currency)} · Ref ${transaction.reference}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Transaction receipt", text });
      } catch {
        // user cancelled the share sheet - not an error
      }
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      toast.success("Receipt details copied to clipboard");
    }
  }

  return (
    <Dialog open={!!transaction} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
        {transaction && (
          <div className="receipt-printable flex flex-col">
            <DialogTitle className="sr-only">Transaction receipt</DialogTitle>

            <div className="from-primary/10 to-accent/10 flex flex-col items-center gap-2 bg-gradient-to-br px-6 pt-8 pb-6 text-center">
              <Badge variant={statusColors[transaction.status]} className="capitalize">
                {transaction.status}
              </Badge>
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  isCredit ? "text-success" : "text-foreground"
                )}
              >
                {isCredit ? "+" : "-"}
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
              <p className="text-muted-foreground text-sm">{transactionLabels[transaction.type]}</p>
              <p className="text-muted-foreground text-xs">
                {formatDate(transaction.createdAt, { dateStyle: "full", timeStyle: "short" })}
              </p>
            </div>

            <div className="px-6 py-5">
              <StatusTimeline status={transaction.status} />
            </div>

            <div className="divide-border/60 flex flex-col divide-y px-6">
              <div className="py-1">
                <DetailRow label="Reference number" value={<CopyField label="Reference" value={transaction.reference} />} />
                <DetailRow label="Transaction ID" value={<CopyField label="Transaction ID" value={transaction.id} />} />
              </div>
              <div className="py-1">
                {loading ? (
                  <div className="space-y-2 py-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <>
                    <DetailRow label="Sender name" value={senderName} />
                    <DetailRow
                      label="Sender account"
                      value={senderAccount ? maskAccountNumber(senderAccount) : undefined}
                    />
                    <DetailRow label="Recipient name" value={recipientName} />
                    <DetailRow
                      label="Recipient account"
                      value={recipientAccount ? maskAccountNumber(recipientAccount) : undefined}
                    />
                    <DetailRow label="Bank name" value={transaction.recipientBank} />
                  </>
                )}
              </div>
              <div className="py-1">
                <DetailRow label="Description" value={transaction.description} />
                <DetailRow
                  label="Fee"
                  value={transaction.fee ? formatCurrency(transaction.fee, transaction.currency) : "No fee"}
                />
                <DetailRow label="Currency" value={transaction.currency} />
                {!loading && (
                  <DetailRow
                    label="Balance after transaction"
                    value={balanceAfter !== undefined ? formatCurrency(balanceAfter, transaction.currency) : undefined}
                  />
                )}
              </div>
            </div>

            <div className="receipt-no-print flex flex-wrap gap-2 px-6 py-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(transaction.reference).then(() => toast.success("Reference copied"))}
              >
                <Copy className="size-3.5" />
                Copy reference
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(transaction.id).then(() => toast.success("Transaction ID copied"))}
              >
                <Copy className="size-3.5" />
                Copy ID
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="size-3.5" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="size-3.5" />
                Share
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
