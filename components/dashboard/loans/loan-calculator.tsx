"use client";

import * as React from "react";

import { calculateMonthlyRepayment } from "@/lib/services/loans";
import { formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const INTEREST_RATE = 12.5;

export function LoanCalculator({
  amount,
  termMonths,
  onAmountChange,
  onTermChange,
}: {
  amount: number;
  termMonths: number;
  onAmountChange: (v: number) => void;
  onTermChange: (v: number) => void;
}) {
  const monthly = calculateMonthlyRepayment(amount, INTEREST_RATE, termMonths);
  const total = monthly * termMonths;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan calculator</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <Label>Loan amount</Label>
            <span className="text-muted-foreground">{formatCurrency(amount)}</span>
          </div>
          <Slider
            value={[amount]}
            min={500}
            max={50000}
            step={500}
            onValueChange={([v]) => onAmountChange(v)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <Label>Term</Label>
            <span className="text-muted-foreground">{termMonths} months</span>
          </div>
          <Slider
            value={[termMonths]}
            min={3}
            max={36}
            step={1}
            onValueChange={([v]) => onTermChange(v)}
          />
        </div>

        <div className="border-border/60 space-y-2 rounded-xl border bg-secondary/40 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Interest rate</span>
            <span className="font-medium">{INTEREST_RATE}% APR</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly repayment</span>
            <span className="font-medium">{formatCurrency(monthly)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total repayment</span>
            <span className="font-medium">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
