"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { adminCreateTransaction } from "@/lib/actions/admin-actions";
import { listAccounts } from "@/lib/services/accounts";
import type { Account } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateTransactionDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [accountId, setAccountId] = React.useState("");
  const [direction, setDirection] = React.useState<"credit" | "debit">("credit");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function lookupAccounts() {
    if (!userId) return;
    try {
      const list = await listAccounts(userId);
      setAccounts(list);
      setAccountId(list[0]?.id ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load accounts.");
    }
  }

  async function handleCreate() {
    if (!userId || !accountId || !amount || !description || !user) {
      toast.error("Fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const result = await adminCreateTransaction(idToken, {
        userId,
        accountId,
        amount: Number(amount),
        direction,
        description,
      });
      if (result.ok) {
        toast.success("Transaction created");
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" />
          New transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create manual transaction</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>User ID (uid)</Label>
            <div className="flex gap-2">
              <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Firebase uid" />
              <Button variant="outline" onClick={lookupAccounts} type="button">
                Load accounts
              </Button>
            </div>
          </div>
          {accounts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={submitting} variant="gradient" className="w-full">
            Create transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
