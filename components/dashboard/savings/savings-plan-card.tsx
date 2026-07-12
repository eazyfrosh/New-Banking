"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { fundSavingsPlan } from "@/lib/actions/savings-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Account, SavingsPlan } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const typeLabels: Record<SavingsPlan["type"], string> = {
  flexible: "Flexible savings",
  target: "Target savings",
  fixed_deposit: "Fixed deposit",
};

export function SavingsPlanCard({
  plan,
  userId,
  primaryAccount,
}: {
  plan: SavingsPlan;
  userId: string;
  primaryAccount?: Account;
}) {
  const [amount, setAmount] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const progress = plan.targetAmount
    ? Math.min(100, (plan.currentAmount / plan.targetAmount) * 100)
    : undefined;

  async function handleFund() {
    if (!primaryAccount || !amount) return;
    setSubmitting(true);
    const result = await fundSavingsPlan({
      userId,
      planId: plan.id,
      fundingAccountId: primaryAccount.id,
      amount: Number(amount),
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Plan funded successfully");
      setOpen(false);
      setAmount("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{plan.name}</p>
            <p className="text-muted-foreground text-xs">{typeLabels[plan.type]}</p>
          </div>
          <Badge variant={plan.status === "active" ? "success" : "secondary"} className="capitalize">
            {plan.status}
          </Badge>
        </div>

        <div>
          <p className="text-2xl font-semibold">{formatCurrency(plan.currentAmount)}</p>
          {plan.targetAmount && (
            <p className="text-muted-foreground text-xs">
              of {formatCurrency(plan.targetAmount)} goal
            </p>
          )}
        </div>

        {progress !== undefined && <Progress value={progress} />}

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{plan.interestRate}% APY</span>
          {plan.endDate && <span>Matures {formatDate(plan.endDate, { dateStyle: "medium" })}</span>}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="size-4" />
              Add funds
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add funds to {plan.name}</DialogTitle>
            </DialogHeader>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <DialogFooter>
              <Button onClick={handleFund} disabled={submitting || !amount} variant="gradient" className="w-full">
                Fund plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
