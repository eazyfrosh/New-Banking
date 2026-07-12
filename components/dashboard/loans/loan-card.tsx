"use client";

import * as React from "react";
import { toast } from "sonner";

import { repayLoan } from "@/lib/actions/loan-actions";
import { buildRepaymentSchedule } from "@/lib/services/loans";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Loan } from "@/types";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant: Record<Loan["status"], "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  active: "success",
  rejected: "destructive",
  completed: "secondary",
  defaulted: "destructive",
};

export function LoanCard({
  loan,
  userId,
  accountId,
}: {
  loan: Loan;
  userId: string;
  accountId?: string;
}) {
  const [repayOpen, setRepayOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(String(loan.monthlyRepayment.toFixed(2)));
  const [submitting, setSubmitting] = React.useState(false);

  const schedule = buildRepaymentSchedule(
    loan.amount,
    loan.interestRate,
    loan.termMonths,
    new Date(loan.disbursedAt ?? loan.createdAt)
  );

  async function handleRepay() {
    if (!accountId) return;
    setSubmitting(true);
    const result = await repayLoan({ userId, loanId: loan.id, accountId, amount: Number(amount) });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Repayment successful");
      setRepayOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{formatCurrency(loan.amount)} loan</p>
            <p className="text-muted-foreground text-xs">{loan.purpose}</p>
          </div>
          <Badge variant={statusVariant[loan.status]} className="capitalize">
            {loan.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Outstanding</p>
            <p className="font-medium">{formatCurrency(loan.outstandingBalance)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Monthly repayment</p>
            <p className="font-medium">{formatCurrency(loan.monthlyRepayment)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Term</p>
            <p className="font-medium">{loan.termMonths} months</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Next payment</p>
            <p className="font-medium">
              {loan.nextRepaymentDate ? formatDate(loan.nextRepaymentDate, { dateStyle: "medium" }) : "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                View schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Repayment schedule</DialogTitle>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((row) => (
                    <TableRow key={row.installment}>
                      <TableCell>{row.installment}</TableCell>
                      <TableCell>{formatDate(row.dueDate, { dateStyle: "medium" })}</TableCell>
                      <TableCell>{formatCurrency(row.principal)}</TableCell>
                      <TableCell>{formatCurrency(row.interest)}</TableCell>
                      <TableCell>{formatCurrency(row.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          {loan.status === "active" && (
            <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="sm" className="flex-1">
                  Make repayment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Repay loan</DialogTitle>
                </DialogHeader>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <DialogFooter>
                  <Button onClick={handleRepay} disabled={submitting} variant="gradient" className="w-full">
                    Confirm repayment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
