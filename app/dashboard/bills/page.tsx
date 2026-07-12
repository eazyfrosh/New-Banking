"use client";

import { Suspense } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { PayBillForm } from "@/components/dashboard/bills/pay-bill-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillsPage() {
  const { profile } = useAuth();
  const { data: accounts } = useAccounts(profile?.uid);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pay bills</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Electricity, cable, internet, water, education, tax, insurance, airtime and data.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        {profile && <PayBillForm userId={profile.uid} accounts={accounts} />}
      </Suspense>
    </div>
  );
}
