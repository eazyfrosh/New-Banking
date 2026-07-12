"use client";

import { useAllLoans, useAllTransactions, useAllUsers } from "@/hooks/use-admin-data";
import {
  dailyTransactionVolume,
  depositsVsWithdrawals,
  loanDistribution,
  monthlyRevenue,
  transferVolume,
  userGrowth,
} from "@/lib/services/analytics";

import { DailyTransactionsChart } from "@/components/admin/charts/daily-transactions-chart";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { UserGrowthChart } from "@/components/admin/charts/user-growth-chart";
import { DepositsWithdrawalsChart } from "@/components/admin/charts/deposits-withdrawals-chart";
import { LoanDistributionChart } from "@/components/admin/charts/loan-distribution-chart";
import { TransferVolumeChart } from "@/components/admin/charts/transfer-volume-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsPage() {
  const { data: transactions, isLoading: txLoading } = useAllTransactions();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: loans, isLoading: loansLoading } = useAllLoans();

  const loading = txLoading || usersLoading || loansLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform performance across transactions, users and lending.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTransactionsChart data={dailyTransactionVolume(transactions ?? [])} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={monthlyRevenue(transactions ?? [])} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User growth</CardTitle>
            </CardHeader>
            <CardContent>
              <UserGrowthChart data={userGrowth(users ?? [])} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deposits vs withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <DepositsWithdrawalsChart data={depositsVsWithdrawals(transactions ?? [])} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <LoanDistributionChart data={loanDistribution(loans ?? [])} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer volume by type</CardTitle>
            </CardHeader>
            <CardContent>
              <TransferVolumeChart data={transferVolume(transactions ?? [])} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
