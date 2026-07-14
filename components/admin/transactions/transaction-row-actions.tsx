"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { adminReverseTransaction, adminReviewTransfer } from "@/lib/actions/admin-actions";
import type { Transaction } from "@/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TransactionRowActions({ transaction }: { transaction: Transaction }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = React.useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
  }

  async function reverse() {
    if (!user) return;
    setBusy(true);
    try {
      const idToken = await user.getIdToken();
      const result = await adminReverseTransaction(idToken, transaction.id);
      if (result.ok) {
        toast.success("Transaction reversed");
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

  async function review(approve: boolean) {
    if (!user) return;
    setBusy(true);
    try {
      const idToken = await user.getIdToken();
      const result = await adminReviewTransfer(idToken, transaction.id, approve);
      if (result.ok) {
        toast.success(approve ? "Transfer approved" : "Transfer rejected");
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

  const isPendingTransfer = transaction.status === "pending" && transaction.type.startsWith("transfer_");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={busy}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isPendingTransfer && (
          <>
            <DropdownMenuItem onSelect={() => review(true)}>Approve transfer</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => review(false)}>
              Reject transfer
            </DropdownMenuItem>
          </>
        )}
        {transaction.status === "completed" && (
          <DropdownMenuItem variant="destructive" onSelect={reverse}>
            Reverse transaction
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
