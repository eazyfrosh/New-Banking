"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { adminAdjustBalance, adminDeleteUser, adminSetUserStatus } from "@/lib/actions/admin-actions";
import { listAccounts } from "@/lib/services/accounts";
import { formatCurrency } from "@/lib/utils";
import type { Account, UserProfile } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UserRowActions({ user }: { user: UserProfile }) {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [balanceOpen, setBalanceOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [accountId, setAccountId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  async function openBalanceDialog() {
    setBalanceOpen(true);
    try {
      const list = await listAccounts(user.uid);
      setAccounts(list);
      setAccountId(list[0]?.id ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load accounts.");
    }
  }

  async function toggleStatus() {
    if (!authUser) return;
    setBusy(true);
    try {
      const idToken = await authUser.getIdToken();
      const next = user.status === "active" ? "suspended" : "active";
      const result = await adminSetUserStatus(idToken, user.uid, next);
      if (result.ok) {
        toast.success(next === "suspended" ? "User suspended" : "User reactivated");
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

  async function handleAdjustBalance() {
    if (!accountId || !amount || !authUser) return;
    setBusy(true);
    try {
      const idToken = await authUser.getIdToken();
      const result = await adminAdjustBalance(idToken, {
        accountId,
        amount: Number(amount),
        reason: reason || "Manual adjustment",
      });
      if (result.ok) {
        toast.success("Balance adjusted");
        setBalanceOpen(false);
        setAmount("");
        setReason("");
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!authUser) return;
    setBusy(true);
    try {
      const idToken = await authUser.getIdToken();
      const result = await adminDeleteUser(idToken, user.uid);
      if (result.ok) {
        toast.success("User deleted");
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openBalanceDialog}>Adjust balance</DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleStatus}>
            {user.status === "active" ? "Suspend user" : "Reactivate user"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust balance — {user.firstName} {user.lastName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} &middot; {formatCurrency(a.balance, a.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Amount (negative to debit)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100 or -50" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Goodwill credit" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdjustBalance} disabled={busy} variant="gradient" className="w-full">
              Apply adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {user.firstName} {user.lastName}&apos;s authentication record
              and profile. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete user</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
