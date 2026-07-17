"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { adminEditTransaction, type TransactionEdit } from "@/lib/actions/admin-actions";
import { CURRENCIES } from "@/lib/currencies";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: TransactionStatus[] = ["pending", "completed", "failed", "cancelled"];

interface FieldChange {
  field: keyof TransactionEdit;
  label: string;
  oldDisplay: string;
  newDisplay: string;
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditTransactionDialog({
  transaction,
  defaultCustomerName,
  onOpenChange,
}: {
  transaction: Transaction | null;
  /** Resolved from the loaded customer list when the transaction has no stored display label yet. */
  defaultCustomerName?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!transaction} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {transaction && (
          // Keyed by transaction id so switching which row is being edited
          // remounts the form with fresh initial state from props, instead
          // of an effect syncing state after the fact.
          <EditTransactionForm
            key={transaction.id}
            transaction={transaction}
            defaultCustomerName={defaultCustomerName}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditTransactionForm({
  transaction,
  defaultCustomerName,
  onOpenChange,
}: {
  transaction: Transaction;
  defaultCustomerName?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = React.useState<"form" | "confirm">("form");
  const [submitting, setSubmitting] = React.useState(false);

  const [customerName, setCustomerName] = React.useState(transaction.customerName ?? defaultCustomerName ?? "");
  const [dateTime, setDateTime] = React.useState(() => toDatetimeLocalValue(transaction.createdAt));
  const [description, setDescription] = React.useState(transaction.description);
  const [amount, setAmount] = React.useState(String(transaction.amount));
  const [currency, setCurrency] = React.useState(transaction.currency);
  const [status, setStatus] = React.useState<TransactionStatus>(
    STATUS_OPTIONS.includes(transaction.status) ? transaction.status : "pending"
  );
  const [category, setCategory] = React.useState(transaction.category ?? "");
  const [reference, setReference] = React.useState(transaction.reference);

  const baselineDateTime = toDatetimeLocalValue(transaction.createdAt);

  function buildChanges(): FieldChange[] {
    if (!transaction) return [];
    const changes: FieldChange[] = [];

    const trimmedName = customerName.trim();
    if (trimmedName && trimmedName !== (transaction.customerName ?? defaultCustomerName ?? "")) {
      changes.push({
        field: "customerName",
        label: "Customer name",
        oldDisplay: transaction.customerName ?? defaultCustomerName ?? "—",
        newDisplay: trimmedName,
      });
    }

    if (dateTime && dateTime !== baselineDateTime) {
      changes.push({
        field: "createdAt",
        label: "Date & time",
        oldDisplay: formatDate(transaction.createdAt),
        newDisplay: formatDate(new Date(dateTime)),
      });
    }

    if (description.trim() && description.trim() !== transaction.description) {
      changes.push({
        field: "description",
        label: "Description",
        oldDisplay: transaction.description,
        newDisplay: description.trim(),
      });
    }

    const numericAmount = Number(amount);
    if (amount && numericAmount !== transaction.amount) {
      changes.push({
        field: "amount",
        label: "Amount",
        oldDisplay: formatCurrency(transaction.amount, transaction.currency),
        newDisplay: formatCurrency(numericAmount, currency || transaction.currency),
      });
    }

    if (currency && currency !== transaction.currency) {
      changes.push({ field: "currency", label: "Currency", oldDisplay: transaction.currency, newDisplay: currency });
    }

    if (status && status !== transaction.status) {
      changes.push({ field: "status", label: "Status", oldDisplay: transaction.status, newDisplay: status });
    }

    const trimmedCategory = category.trim();
    if (trimmedCategory !== (transaction.category ?? "")) {
      changes.push({
        field: "category",
        label: "Category",
        oldDisplay: transaction.category ?? "—",
        newDisplay: trimmedCategory || "—",
      });
    }

    if (reference.trim() && reference.trim() !== transaction.reference) {
      changes.push({
        field: "reference",
        label: "Reference number",
        oldDisplay: transaction.reference,
        newDisplay: reference.trim(),
      });
    }

    return changes;
  }

  const changes = step === "confirm" ? buildChanges() : [];

  function handleReview() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!reference.trim()) {
      toast.error("Reference number cannot be empty.");
      return;
    }
    if (!description.trim()) {
      toast.error("Description cannot be empty.");
      return;
    }
    if (buildChanges().length === 0) {
      toast.error("No changes to save.");
      return;
    }
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!user || !transaction) return;
    const finalChanges = buildChanges();
    if (finalChanges.length === 0) {
      toast.error("No changes to save.");
      return;
    }

    const updates: TransactionEdit = {};
    for (const change of finalChanges) {
      switch (change.field) {
        case "customerName":
          updates.customerName = customerName.trim();
          break;
        case "createdAt":
          updates.createdAt = new Date(dateTime).toISOString();
          break;
        case "description":
          updates.description = description.trim();
          break;
        case "amount":
          updates.amount = Number(amount);
          break;
        case "currency":
          updates.currency = currency;
          break;
        case "status":
          updates.status = status;
          break;
        case "category":
          updates.category = category.trim();
          break;
        case "reference":
          updates.reference = reference.trim();
          break;
      }
    }

    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const result = await adminEditTransaction(idToken, transaction.id, updates);
      if (result.ok) {
        toast.success("Transaction updated");
        queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="size-4" />
          {step === "form" ? "Edit transaction" : "Confirm changes"}
        </DialogTitle>
        <DialogDescription>
          {step === "form"
            ? `Reference ${transaction.reference}`
            : "Review the old and new values before saving. This updates Firestore immediately."}
        </DialogDescription>
      </DialogHeader>

      {step === "form" ? (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Customer name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Date &amp; time</Label>
              <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Amount</Label>
                <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TransactionStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Reference number</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} className="font-mono" />
            </div>

            <DialogFooter>
              <Button onClick={handleReview} variant="gradient" className="w-full">
                Review changes
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="divide-border/60 border-border/60 divide-y rounded-xl border">
              {changes.map((c) => (
                <div key={c.field} className="flex flex-col gap-1 p-3 text-sm">
                  <span className="text-muted-foreground text-xs font-medium">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-destructive/80 line-through">{c.oldDisplay}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="text-success font-medium">{c.newDisplay}</span>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setStep("form")} disabled={submitting} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={submitting} variant="gradient" className="flex-1">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Confirm &amp; save
              </Button>
            </DialogFooter>
          </div>
      )}
    </>
  );
}
