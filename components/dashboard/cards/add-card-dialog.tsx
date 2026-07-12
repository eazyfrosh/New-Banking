"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createCard } from "@/lib/actions/card-actions";
import type { Account } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddCardDialog({
  userId,
  accounts,
  cardholderName,
}: {
  userId: string;
  accounts: Account[];
  cardholderName: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"virtual" | "physical">("virtual");
  const [network, setNetwork] = React.useState<"visa" | "mastercard" | "verve">("visa");
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleCreate() {
    if (!accountId) return;
    setSubmitting(true);
    const result = await createCard({ userId, accountId, type, network, cardholderName });
    setSubmitting(false);
    if (result.ok) {
      toast.success(`New ${type} card issued`);
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" />
          New card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue a new card</DialogTitle>
          <DialogDescription>Virtual cards are ready instantly for online spending.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Card type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">Virtual card</SelectItem>
                <SelectItem value="physical">Physical card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Network</Label>
            <Select value={network} onValueChange={(v) => setNetwork(v as typeof network)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="verve">Verve</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Linked account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={submitting} variant="gradient" className="w-full">
            Issue card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
