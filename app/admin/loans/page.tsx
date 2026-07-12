"use client";

import { useAllLoans } from "@/hooks/use-admin-data";
import { formatCurrency, formatDate } from "@/lib/utils";

import { LoanRowActions } from "@/components/admin/loans/loan-row-actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeDollarSign } from "lucide-react";

const statusVariant = {
  pending: "warning",
  approved: "success",
  active: "success",
  rejected: "destructive",
  completed: "secondary",
  defaulted: "destructive",
} as const;

export default function AdminLoansPage() {
  const { data: loans, isLoading } = useAllLoans();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loans</h1>
        <p className="text-muted-foreground mt-1 text-sm">Review and approve customer loan applications.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !loans || loans.length === 0 ? (
        <EmptyState icon={BadgeDollarSign} title="No loan applications yet" />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{formatCurrency(loan.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{loan.purpose}</TableCell>
                  <TableCell>{loan.termMonths} months</TableCell>
                  <TableCell>{formatCurrency(loan.outstandingBalance)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[loan.status]} className="capitalize">
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(loan.createdAt, { dateStyle: "medium" })}</TableCell>
                  <TableCell className="text-right">
                    <LoanRowActions loan={loan} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
