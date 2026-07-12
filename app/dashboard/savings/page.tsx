"use client";

import { PiggyBank } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { useSavingsPlans } from "@/hooks/use-savings-plans";

import { CreatePlanDialog } from "@/components/dashboard/savings/create-plan-dialog";
import { SavingsPlanCard } from "@/components/dashboard/savings/savings-plan-card";
import { InterestCalculator } from "@/components/dashboard/savings/interest-calculator";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavingsPage() {
  const { profile } = useAuth();
  const { data: accounts } = useAccounts(profile?.uid);
  const { data: plans, loading } = useSavingsPlans(profile?.uid);

  const currentAccount = accounts.find((a) => a.type === "current");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Savings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build flexible, target and fixed-deposit savings plans.
          </p>
        </div>
        {profile && <CreatePlanDialog userId={profile.uid} accounts={accounts} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No savings plans yet"
              description="Create your first plan to start building toward a goal."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.map((plan) => (
                <SavingsPlanCard
                  key={plan.id}
                  plan={plan}
                  userId={profile!.uid}
                  primaryAccount={currentAccount}
                />
              ))}
            </div>
          )}
        </div>

        <InterestCalculator />
      </div>
    </div>
  );
}
