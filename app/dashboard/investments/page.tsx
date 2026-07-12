"use client";

import { LineChart } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { useInvestments } from "@/hooks/use-investments";
import { investmentPnL, investmentValue } from "@/lib/services/investments";
import { formatCurrency } from "@/lib/utils";

import { BuyInvestmentDialog } from "@/components/dashboard/investments/buy-investment-dialog";
import { HoldingCard } from "@/components/dashboard/investments/holding-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvestmentsPage() {
  const { profile } = useAuth();
  const { data: accounts } = useAccounts(profile?.uid);
  const { data: investments, loading } = useInvestments(profile?.uid);
  const currentAccount = accounts.find((a) => a.type === "current");

  const totalValue = investments.reduce((sum, inv) => sum + investmentValue(inv), 0);
  const totalPnL = investments.reduce((sum, inv) => sum + investmentPnL(inv).amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mutual funds, stocks and demo crypto — track it all in one portfolio.
          </p>
        </div>
        {profile && <BuyInvestmentDialog userId={profile.uid} accounts={accounts} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs">Portfolio value</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-xs">All-time profit / loss</p>
            <p className={totalPnL >= 0 ? "text-success text-2xl font-semibold" : "text-destructive text-2xl font-semibold"}>
              {totalPnL >= 0 ? "+" : ""}
              {formatCurrency(totalPnL)}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : investments.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="No investments yet"
          description="Start building your portfolio today."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investments.map((inv) => (
            <HoldingCard key={inv.id} investment={inv} userId={profile!.uid} account={currentAccount} />
          ))}
        </div>
      )}
    </div>
  );
}
