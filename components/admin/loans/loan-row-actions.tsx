"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { adminReviewLoan } from "@/lib/actions/loan-actions";
import { listAccounts } from "@/lib/services/accounts";
import type { Loan } from "@/types";

import { Button } from "@/components/ui/button";

export function LoanRowActions({ loan }: { loan: Loan }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = React.useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "loans"] });
  }

  async function approve() {
    if (!user) return;
    setBusy(true);
    try {
      const idToken = await user.getIdToken();
      const accounts = await listAccounts(loan.userId);
      const currentAccount = accounts.find((a) => a.type === "current");
      const result = await adminReviewLoan(idToken, {
        loanId: loan.id,
        approve: true,
        disburseAccountId: currentAccount?.id,
      });
      if (result.ok) {
        toast.success("Loan approved and disbursed");
        invalidate();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!user) return;
    setBusy(true);
    try {
      const idToken = await user.getIdToken();
      const result = await adminReviewLoan(idToken, { loanId: loan.id, approve: false });
      if (result.ok) {
        toast.success("Loan rejected");
        invalidate();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
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
