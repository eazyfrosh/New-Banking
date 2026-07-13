"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [busy, setBusy] = React.useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
  }

  async function reverse() {
    setBusy(true);
    try {
      const result = await adminReverseTransaction(transaction.id);
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
    setBusy(true);
    try {
      const result = await adminReviewTransfer(transaction.id, approve);
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
