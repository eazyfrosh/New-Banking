"use client";

import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  CreditCard,
  LineChart,
  PiggyBank,
  Receipt,
  TicketCheck,
  Users,
} from "lucide-react";

import {
  useAllLoans,
  useAllTransactions,
  useAllUsers,
  useFraudAlerts,
  useSupportTickets,
} from "@/hooks/use-admin-data";
import { monthlyRevenue } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils";

import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewPage() {
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: transactions, isLoading: txLoading } = useAllTransactions();
  const { data: loans } = useAllLoans();
  const { data: tickets } = useSupportTickets();
  const { data: alerts } = useFraudAlerts();

  const totalUsers = users?.length ?? 0;
  const totalTransactions = transactions?.length ?? 0;
  const totalVolume = transactions?.reduce((s, t) => s + t.amount, 0) ?? 0;
  const totalRevenue = transactions?.reduce((s, t) => s + (t.fee ?? t.amount * 0.015), 0) ?? 0;
  const activeLoans = loans?.filter((l) => l.status === "active").length ?? 0;
  const outstandingLoans = loans?.reduce((s, l) => s + l.outstandingBalance, 0) ?? 0;
  const openTickets = tickets?.filter((t) => t.status === "open").length ?? 0;
  const openAlerts = alerts?.filter((a) => a.status === "open").length ?? 0;

  const revenueData = transactions ? monthlyRevenue(transactions) : [];

  const loading = usersLoading || txLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform-wide statistics and system health at a glance.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total users" value={totalUsers} icon={Users} />
          <StatCard label="Transactions" value={totalTransactions} icon={Receipt} />
          <StatCard label="Transaction volume" value={totalVolume} prefix="$" decimals={2} icon={Receipt} />
          <StatCard label="Platform revenue" value={totalRevenue} prefix="$" decimals={2} icon={BadgeDollarSign} />
          <StatCard label="Active loans" value={activeLoans} icon={PiggyBank} />
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
                <span className="text-muted-foreground">Avg. response time</span>
                <span className="font-medium">142ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Error rate</span>
                <span className="font-medium">0.03%</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
