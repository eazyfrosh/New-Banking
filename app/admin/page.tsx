"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  Clock,
  CreditCard,
  LineChart,
  PiggyBank,
  Receipt,
  ShieldCheck,
  TicketCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import {
  useAllAccounts,
  useAllLoans,
  useAllTransactions,
  useAllUsers,
  useFraudAlerts,
  useSupportTickets,
} from "@/hooks/use-admin-data";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { monthlyRevenue } from "@/lib/services/analytics";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewPage() {
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: accounts, isLoading: accountsLoading } = useAllAccounts();
  const { data: transactions, isLoading: txLoading } = useAllTransactions();
  const { data: loans } = useAllLoans();
  const { data: tickets } = useSupportTickets();
  const { data: alerts } = useFraudAlerts();
  const { data: rates } = useExchangeRates("USD");

  const customers = users?.filter((u) => u.role === "customer") ?? [];
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((u) => u.status === "active").length;
  const suspendedCustomers = customers.filter((u) => u.status === "suspended").length;
  const pendingApprovals = customers.filter((u) => u.reviewStatus === "pending").length;

  const totalTransactions = transactions?.length ?? 0;
  const totalDeposits = transactions?.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0) ?? 0;
  const totalWithdrawals =
    transactions?.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0) ?? 0;
  // Accounts span multiple currencies platform-wide, so a raw sum would be
  // meaningless - convert each into USD using the live rate before summing.
  const totalBalances =
    accounts?.reduce((s, a) => {
      if (!rates || a.currency === rates.base) return s + a.balance;
      const rate = rates.rates[a.currency];
      return rate ? s + a.balance / rate : s;
    }, 0) ?? 0;
  const totalRevenue = transactions?.reduce((s, t) => s + (t.fee ?? t.amount * 0.015), 0) ?? 0;
  const activeLoans = loans?.filter((l) => l.status === "active").length ?? 0;
  const outstandingLoans = loans?.reduce((s, l) => s + l.outstandingBalance, 0) ?? 0;
  const openTickets = tickets?.filter((t) => t.status === "open").length ?? 0;
  const openAlerts = alerts?.filter((a) => a.status === "open").length ?? 0;

  const revenueData = transactions ? monthlyRevenue(transactions) : [];
  const recentRegistrations = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const recentTransactions = (transactions ?? []).slice(0, 5);

  const loading = usersLoading || txLoading || accountsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform-wide statistics and system health at a glance.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total customers" value={totalCustomers} icon={Users} />
          <StatCard label="Active customers" value={activeCustomers} icon={UserCheck} />
          <StatCard label="Suspended customers" value={suspendedCustomers} icon={UserMinus} />
          <StatCard label="Pending approvals" value={pendingApprovals} icon={Clock} />
          <StatCard label="Total deposits" value={totalDeposits} prefix="$" decimals={2} icon={ArrowDownCircle} />
          <StatCard label="Total withdrawals" value={totalWithdrawals} prefix="$" decimals={2} icon={ArrowUpCircle} />
          <StatCard label="Total account balances" value={totalBalances} prefix="$" decimals={2} icon={Wallet} />
          <StatCard label="Transaction volume" value={totalTransactions} icon={Receipt} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4.5" />
                System health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">API uptime</span>
                <Badge variant="success">99.98%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform revenue</span>
                <span className="font-medium">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active loans</span>
                <span className="font-medium">{activeLoans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding loan balance</span>
                <span className="font-medium">{formatCurrency(outstandingLoans)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4.5" />
                Needs attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <TicketCheck className="size-4" /> Open support tickets
                </span>
                <Badge variant={openTickets > 0 ? "warning" : "secondary"}>{openTickets}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="size-4" /> Fraud alerts
                </span>
                <Badge variant={openAlerts > 0 ? "destructive" : "secondary"}>{openAlerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <LineChart className="size-4" /> Pending loans
                </span>
                <Badge variant="secondary">{loans?.filter((l) => l.status === "pending").length ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="size-4" /> Pending account approvals
                </span>
                <Badge variant={pendingApprovals > 0 ? "warning" : "secondary"}>{pendingApprovals}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <PiggyBank className="size-4" /> Pending transfers
                </span>
                <Badge variant="secondary">
                  {transactions?.filter((t) => t.status === "pending" && t.type.startsWith("transfer_")).length ?? 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4.5" />
              Recent registrations
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-border/60 divide-y">
            {recentRegistrations.length === 0 ? (
              <EmptyState icon={Users} title="No customers yet" />
            ) : (
              recentRegistrations.map((u) => (
                <Link
                  key={u.uid}
                  href={`/admin/users/${u.uid}`}
                  className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[10px]">{initials(`${u.firstName} ${u.lastName}`)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(u.createdAt, { dateStyle: "medium" })}
                    </span>
                    {u.reviewStatus === "pending" && (
                      <Badge variant="warning" className="text-[10px]">
                        Needs review
                      </Badge>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeDollarSign className="size-4.5" />
              Recent transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-border/60 divide-y">
            {recentTransactions.length === 0 ? (
              <EmptyState icon={Receipt} title="No transactions yet" />
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-muted-foreground text-xs">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className={tx.direction === "credit" ? "text-success text-sm font-medium" : "text-sm font-medium"}>
                    {tx.direction === "credit" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
