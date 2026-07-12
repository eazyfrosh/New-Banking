"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminReviewLoan } from "@/lib/actions/loan-actions";
import { listAccounts } from "@/lib/services/accounts";
import type { Loan } from "@/types";

import { Button } from "@/components/ui/button";

export function LoanRowActions({ loan }: { loan: Loan }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = React.useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "loans"] });
  }

  async function approve() {
    setBusy(true);
    const accounts = await listAccounts(loan.userId);
    const currentAccount = accounts.find((a) => a.type === "current");
    const result = await adminReviewLoan({
      loanId: loan.id,
      approve: true,
      disburseAccountId: currentAccount?.id,
    });
    setBusy(false);
    if (result.ok) {
      toast.success("Loan approved and disbursed");
      invalidate();
    } else {
      toast.error(result.error);
    }
  }

  async function reject() {
    setBusy(true);
    const result = await adminReviewLoan({ loanId: loan.id, approve: false });
    setBusy(false);
    if (result.ok) {
      toast.success("Loan rejected");
      invalidate();
    } else {
      toast.error(result.error);
    }
  }

  if (loan.status !== "pending") return null;

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={reject}>
        Reject
      </Button>
      <Button size="sm" variant="gradient" disabled={busy} onClick={approve}>
        Approve
      </Button>
    </div>
  );
}
