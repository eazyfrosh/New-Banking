"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { applyForLoan } from "@/lib/actions/loan-actions";

import { LoanCalculator } from "@/components/dashboard/loans/loan-calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ApplyLoanForm({ userId }: { userId: string }) {
  const [amount, setAmount] = React.useState(5000);
  const [termMonths, setTermMonths] = React.useState(12);
  const [purpose, setPurpose] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleApply() {
    if (!purpose) {
      toast.error("Tell us what the loan is for.");
      return;
    }
    setSubmitting(true);
    const result = await applyForLoan({ userId, amount, termMonths, purpose });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Loan application submitted for review");
      setPurpose("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LoanCalculator
        amount={amount}
        termMonths={termMonths}
        onAmountChange={setAmount}
        onTermChange={setTermMonths}
      />

      <Card>
        <CardHeader>
          <CardTitle>Apply for this loan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Purpose</Label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Home renovation"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Approval decisions are typically made within one business day. Funds are disbursed
            directly to your current account.
          </p>
          <Button onClick={handleApply} disabled={submitting} variant="gradient" size="lg">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit application
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
