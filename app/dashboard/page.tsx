"use client";

import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useLoans } from "@/hooks/use-loans";
import { useInvestments } from "@/hooks/use-investments";
import { investmentValue, investmentPnL } from "@/lib/services/investments";
import { exchangeRates } from "@/lib/exchange-rates";
import { formatCurrency } from "@/lib/utils";

import { AccountCard } from "@/components/dashboard/account-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { EmptyState } from "@/components/shared/empty-state";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: accounts, loading: accountsLoading } = useAccounts(profile?.uid);
  const { data: transactions, loading: txLoading } = useTransactions(profile?.uid);
  const { data: loans } = useLoans(profile?.uid);
  const { data: investments } = useInvestments(profile?.uid);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeLoan = loans.find((loan) => loan.status === "active");
  const portfolioValue = investments.reduce((sum, inv) => sum + investmentValue(inv), 0);
  const portfolioPnL = investments.reduce((sum, inv) => sum + investmentPnL(inv).amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{profile ? `, ${profile.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here&apos;s what&apos;s happening with your money today.
          </p>
        </div>
        <Card className="border-primary/20 bg-primary/5 py-3">
          <CardContent className="flex items-center gap-3 px-4">
            <div>
              <p className="text-muted-foreground text-xs">Total balance</p>
              <p className="text-xl font-semibold">
                <AnimatedCounter value={totalBalance} prefix="$" decimals={2} />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <QuickActions />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accountsLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)
          : accounts.map((account) => <AccountCard key={account.id} account={account} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/transactions">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-border/60 divide-y">
            {txLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="my-1.5 h-12" />)
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Your recent activity will show up here."
              />
            ) : (
              transactions.slice(0, 6).map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan status</CardTitle>
            </CardHeader>
            <CardContent>
              {activeLoan ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-medium">
                      {formatCurrency(activeLoan.outstandingBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly repayment</span>
                    <span className="font-medium">
                      {formatCurrency(activeLoan.monthlyRepayment)}
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="mt-2 w-full">
                    <Link href="/dashboard/loans">Manage loan</Link>
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="No active loans"
                  description="Apply for a loan in minutes."
                  action={
                    <Button asChild size="sm" variant="gradient">
                      <Link href="/dashboard/loans">Apply now</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(portfolioValue)}</p>
              <p className={portfolioPnL >= 0 ? "text-success text-sm" : "text-destructive text-sm"}>
                {portfolioPnL >= 0 ? "+" : ""}
                {formatCurrency(portfolioPnL)} all-time
              </p>
              <Button asChild size="sm" variant="ghost" className="mt-2 w-full">
                <Link href="/dashboard/investments">
                  View portfolio <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exchange rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exchangeRates.slice(0, 4).map((rate) => (
                <div key={rate.currency} className="flex items-center justify-between text-sm">
                  <span className="font-medium">USD/{rate.currency}</span>
                  <div className="flex items-center gap-2">
                    <span>{rate.rate.toFixed(2)}</span>
                    <span className={rate.change >= 0 ? "text-success text-xs" : "text-destructive text-xs"}>
                      {rate.change >= 0 ? "+" : ""}
                      {rate.change}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
