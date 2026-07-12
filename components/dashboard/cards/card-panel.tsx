"use client";

import * as React from "react";
import { Eye, Loader2, Lock, RefreshCw, Snowflake } from "lucide-react";
import { toast } from "sonner";

import { replaceCard, setCardStatus, updateCardLimits } from "@/lib/actions/card-actions";
import { revealCardDetails } from "@/lib/actions/card-secrets";
import { formatCurrency } from "@/lib/utils";
import type { BankCard, Transaction } from "@/types";

import { CardVisual } from "@/components/dashboard/cards/card-visual";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";

export function CardPanel({
  card,
  userId,
  transactions,
}: {
  card: BankCard;
  userId: string;
  transactions: Transaction[];
}) {
  const [busy, setBusy] = React.useState(false);
  const [pinDialogOpen, setPinDialogOpen] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [revealed, setRevealed] = React.useState<{ cardNumber: string; cvv: string; pin: string } | null>(null);
  const [limitsOpen, setLimitsOpen] = React.useState(false);
  const [dailyLimit, setDailyLimit] = React.useState(String(card.dailyLimit));
  const [monthlyLimit, setMonthlyLimit] = React.useState(String(card.monthlyLimit));

  async function toggleFreeze() {
    setBusy(true);
    const next = card.status === "frozen" ? "active" : "frozen";
    const result = await setCardStatus(card.id, userId, next);
    if (result.ok) {
      toast.success(next === "frozen" ? "Card frozen" : "Card unfrozen");
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  }

  async function handleReplace() {
    setBusy(true);
    const result = await replaceCard(card.id, userId);
    if (result.ok) {
      toast.success("Card replaced. New details generated.");
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  }

  async function handleReveal() {
    setBusy(true);
    const result = await revealCardDetails({ cardId: card.id, userId, pin });
    if (result.ok) {
      setRevealed(result);
      setPinDialogOpen(false);
      setPin("");
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  }

  async function handleUpdateLimits() {
    setBusy(true);
    const result = await updateCardLimits(card.id, userId, {
      dailyLimit: Number(dailyLimit),
      monthlyLimit: Number(monthlyLimit),
    });
    if (result.ok) {
      toast.success("Card limits updated");
      setLimitsOpen(false);
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-4">
        <CardVisual card={card} revealedNumber={revealed ? formatRevealed(revealed.cardNumber) : undefined} />

        {revealed && (
          <Card className="border-primary/30">
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">CVV</p>
                <p className="font-mono font-medium">{revealed.cvv}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">PIN</p>
                <p className="font-mono font-medium">{revealed.pin}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={toggleFreeze} disabled={busy}>
            <Snowflake className="size-4" />
            {card.status === "frozen" ? "Unfreeze" : "Freeze"}
          </Button>

          <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="size-4" />
                Show PIN
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verify it&apos;s you</DialogTitle>
                <DialogDescription>Enter your transaction PIN to view card details.</DialogDescription>
              </DialogHeader>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="text-center text-2xl tracking-[0.5em]"
              />
              <DialogFooter>
                <Button onClick={handleReveal} disabled={busy || pin.length !== 4} className="w-full" variant="gradient">
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Reveal details
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="size-4" />
                Replace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replace this card?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current card number will be permanently deactivated and a new one issued
                  instantly.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReplace}>Replace card</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Lock className="size-4" />
                Limits
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Card limits</DialogTitle>
                <DialogDescription>Set daily and monthly spending limits.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Daily limit</Label>
                  <Input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Monthly limit</Label>
                  <Input type="number" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateLimits} disabled={busy} variant="gradient" className="w-full">
                  Save limits
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily limit</span>
              <span className="font-medium">{formatCurrency(card.dailyLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly limit</span>
              <span className="font-medium">{formatCurrency(card.monthlyLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{card.status}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h3 className="mb-2 font-semibold">Card transactions</h3>
          <div className="divide-border/60 divide-y">
            {transactions.length === 0 ? (
              <EmptyState icon={Receipt} title="No transactions on this card yet" />
            ) : (
              transactions.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatRevealed(cardNumber: string) {
  return cardNumber.replace(/(.{4})/g, "$1 ").trim();
}
