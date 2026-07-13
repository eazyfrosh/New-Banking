"use client";

import * as React from "react";
import { toast } from "sonner";

import { sellInvestment } from "@/lib/actions/investment-actions";
import { investmentPnL, investmentValue } from "@/lib/services/investments";
import { formatCurrency } from "@/lib/utils";
import type { Account, Investment } from "@/types";

import { PerformanceChart } from "@/components/dashboard/investments/performance-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function HoldingCard({
  investment,
  userId,
  account,
}: {
  investment: Investment;
  userId: string;
  account?: Account;
}) {
  const [sellUnits, setSellUnits] = React.useState(String(investment.units));
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const value = investmentValue(investment);
  const pnl = investmentPnL(investment);

  async function handleSell() {
    if (!account) return;
    setSubmitting(true);
    try {
      const result = await sellInvestment({
        userId,
        accountId: account.id,
        investmentId: investment.id,
        units: Number(sellUnits),
      });
      if (result.ok) {
        toast.success("Sold successfully");
        setOpen(false);
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
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{investment.name}</p>
            <p className="text-muted-foreground text-xs">
              {investment.symbol} &middot; {investment.units} units
            </p>
          </div>
          <Badge variant={pnl.amount >= 0 ? "success" : "destructive"}>
            {pnl.amount >= 0 ? "+" : ""}
            {pnl.percent.toFixed(1)}%
          </Badge>
        </div>

        <div>
          <p className="text-2xl font-semibold">{formatCurrency(value)}</p>
          <p className={pnl.amount >= 0 ? "text-success text-xs" : "text-destructive text-xs"}>
            {pnl.amount >= 0 ? "+" : ""}
            {formatCurrency(pnl.amount)} all-time
          </p>
        </div>

        <PerformanceChart basePrice={investment.currentPrice} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Sell
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sell {investment.symbol}</DialogTitle>
            </DialogHeader>
            <Input
              type="number"
              max={investment.units}
              value={sellUnits}
              onChange={(e) => setSellUnits(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={handleSell} disabled={submitting} variant="gradient" className="w-full">
                Confirm sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
