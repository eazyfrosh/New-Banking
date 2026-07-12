"use client";

import { BadgeDollarSign } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { useLoans } from "@/hooks/use-loans";

import { ApplyLoanForm } from "@/components/dashboard/loans/apply-loan-form";
import { LoanCard } from "@/components/dashboard/loans/loan-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoansPage() {
  const { profile } = useAuth();
  const { data: accounts } = useAccounts(profile?.uid);
  const { data: loans, loading } = useLoans(profile?.uid);
  const currentAccount = accounts.find((a) => a.type === "current");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loans</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Apply for a loan, track approvals, and manage repayments.
        </p>
      </div>

      <Tabs defaultValue="my-loans">
        <TabsList>
          <TabsTrigger value="my-loans">My loans</TabsTrigger>
          <TabsTrigger value="apply">Apply for a loan</TabsTrigger>
        </TabsList>

        <TabsContent value="my-loans" className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <EmptyState
              icon={BadgeDollarSign}
              title="No loans yet"
              description="Apply for your first loan to see it here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {loans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} userId={profile!.uid} accountId={currentAccount?.id} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="apply" className="mt-6">
          {profile && <ApplyLoanForm userId={profile.uid} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
