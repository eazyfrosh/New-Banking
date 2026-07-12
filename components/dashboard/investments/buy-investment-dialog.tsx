"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { buyInvestment } from "@/lib/actions/investment-actions";
import { marketInstruments } from "@/lib/market-data";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BuyInvestmentDialog({ userId, accounts }: { userId: string; accounts: Account[] }) {
  const [open, setOpen] = React.useState(false);
  const [symbol, setSymbol] = React.useState(marketInstruments[0].symbol);
  const [units, setUnits] = React.useState("1");
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  const instrument = marketInstruments.find((i) => i.symbol === symbol)!;
  const cost = Number(units || 0) * instrument.price;

  async function handleBuy() {
    if (!accountId) return;
    setSubmitting(true);
    const result = await buyInvestment({
      userId,
      accountId,
      type: instrument.type,
      symbol: instrument.symbol,
      name: instrument.name,
      units: Number(units),
      price: instrument.price,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success(`Bought ${units} ${instrument.symbol}`);
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
          Invest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy an asset</DialogTitle>
          <DialogDescription>Demo pricing — no real funds are traded.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Asset</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {marketInstruments.map((i) => (
                  <SelectItem key={i.symbol} value={i.symbol}>
                    {i.name} ({i.symbol}) &middot; {formatCurrency(i.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Units</Label>
            <Input type="number" min="0" step="0.01" value={units} onChange={(e) => setUnits(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Funding account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} &middot; {formatCurrency(account.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-border/60 flex justify-between rounded-xl border bg-secondary/40 p-3 text-sm">
            <span className="text-muted-foreground">Estimated cost</span>
            <span className="font-medium">{formatCurrency(cost)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleBuy} disabled={submitting || !accountId} variant="gradient" className="w-full">
            Confirm purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
