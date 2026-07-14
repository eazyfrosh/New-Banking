"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Plus,
  Snowflake,
  Unlock,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useAllAccounts, useAllCards, useAllTransactions, useAllUsers } from "@/hooks/use-admin-data";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  adminApproveRegistration,
  adminDeleteUser,
  adminIssueCard,
  adminOpenAccount,
  adminRejectRegistration,
  adminReplaceCard,
  adminResetTransactionPin,
  adminSendNotification,
  adminSetAccountStatus,
  adminSetCardStatus,
  adminSetUserStatus,
  adminAdjustBalance,
  adminTransferFunds,
  adminUpdateProfile,
} from "@/lib/actions/admin-actions";
import { formatCurrency, formatDate, initials, maskCardNumber } from "@/lib/utils";
import type { AccountType } from "@/types";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const accountStatusVariant = {
  active: "success",
  frozen: "warning",
  closed: "destructive",
} as const;

export default function AdminCustomerDetailPage() {
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: allAccounts, isLoading: accountsLoading } = useAllAccounts();
  const { data: allCards, isLoading: cardsLoading } = useAllCards();
  const { data: allTransactions, isLoading: txLoading } = useAllTransactions();

  const customer = users?.find((u) => u.uid === uid);
  const accounts = (allAccounts ?? []).filter((a) => a.userId === uid);
  const cards = (allCards ?? []).filter((c) => c.userId === uid);
  const transactions = (allTransactions ?? []).filter((t) => t.userId === uid).slice(0, 20);

  const [busy, setBusy] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [resetPinOpen, setResetPinOpen] = React.useState(false);
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [openAccountOpen, setOpenAccountOpen] = React.useState(false);
  const [moneyOpen, setMoneyOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [issueCardOpen, setIssueCardOpen] = React.useState(false);
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);

  const [editFirstName, setEditFirstName] = React.useState("");
  const [editLastName, setEditLastName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editAddress, setEditAddress] = React.useState("");
  const [editOccupation, setEditOccupation] = React.useState("");
  const [editDateOfBirth, setEditDateOfBirth] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");

  const [notifyTitle, setNotifyTitle] = React.useState("");
  const [notifyMessage, setNotifyMessage] = React.useState("");
  const [newAccountType, setNewAccountType] = React.useState<AccountType>("current");
  const [moneyAccountId, setMoneyAccountId] = React.useState("");
  const [moneyMode, setMoneyMode] = React.useState<"deposit" | "withdraw" | "adjust">("deposit");
  const [moneyAmount, setMoneyAmount] = React.useState("");
  const [moneyReason, setMoneyReason] = React.useState("");
  const [transferFrom, setTransferFrom] = React.useState("");
  const [transferTo, setTransferTo] = React.useState("");
  const [transferAmount, setTransferAmount] = React.useState("");
  const [transferNote, setTransferNote] = React.useState("");
  const [cardAccountId, setCardAccountId] = React.useState("");
  const [cardType, setCardType] = React.useState<"virtual" | "physical">("virtual");
  const [cardNetwork, setCardNetwork] = React.useState<"visa" | "mastercard" | "verve">("visa");

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  async function withToken<T>(fn: (idToken: string) => Promise<T>): Promise<T | null> {
    if (!authUser) return null;
    setBusy(true);
    try {
      const idToken = await authUser.getIdToken();
      return await fn(idToken);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleStatus() {
    if (!customer) return;
    const next = customer.status === "active" ? "suspended" : "active";
    const result = await withToken((idToken) => adminSetUserStatus(idToken, uid, next));
    if (!result) return;
    if (result.ok) {
      toast.success(next === "suspended" ? "Customer suspended" : "Customer reactivated");
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  function openEditProfile() {
    if (!customer) return;
    setEditFirstName(customer.firstName);
    setEditLastName(customer.lastName);
    setEditPhone(customer.phone ?? "");
    setEditAddress(customer.address ?? "");
    setEditOccupation(customer.occupation ?? "");
    setEditDateOfBirth(customer.dateOfBirth ?? "");
    setEditEmail(customer.email);
    setEditProfileOpen(true);
  }

  async function handleSaveProfile() {
    const result = await withToken((idToken) =>
      adminUpdateProfile(idToken, uid, {
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        address: editAddress,
        occupation: editOccupation,
        dateOfBirth: editDateOfBirth,
        email: editEmail,
      })
    );
    if (!result) return;
    if (result.ok) {
      if (result.changedFields.length === 0) {
        toast.message("No changes to save");
      } else {
        toast.success(`Profile updated (${result.changedFields.join(", ")})`);
      }
      setEditProfileOpen(false);
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    const result = await withToken((idToken) => adminDeleteUser(idToken, uid));
    if (!result) return;
    if (result.ok) {
      toast.success("Customer deleted");
      router.push("/admin/users");
    } else {
      toast.error(result.error);
    }
  }

  async function handleApprove() {
    const result = await withToken((idToken) => adminApproveRegistration(idToken, uid));
    if (!result) return;
    if (result.ok) {
      toast.success("Registration approved");
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleReject() {
    const result = await withToken((idToken) => adminRejectRegistration(idToken, uid));
    if (!result) return;
    if (result.ok) {
      toast.success("Registration rejected, customer suspended");
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleResetPin() {
    const result = await withToken((idToken) => adminResetTransactionPin(idToken, uid));
    if (!result) return;
    setResetPinOpen(false);
    if (result.ok) {
      toast.success("Transaction PIN cleared - customer must set a new one.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleResetPassword() {
    if (!customer) return;
    setBusy(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), customer.email);
      toast.success(`Password reset email sent to ${customer.email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send reset email.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendNotification() {
    if (!notifyTitle || !notifyMessage) {
      toast.error("Fill in a title and message.");
      return;
    }
    const result = await withToken((idToken) =>
      adminSendNotification(idToken, { userId: uid, title: notifyTitle, message: notifyMessage, type: "system" })
    );
    if (!result) return;
    if (result.ok) {
      toast.success("Notification sent");
      setNotifyOpen(false);
      setNotifyTitle("");
      setNotifyMessage("");
    } else {
      toast.error(result.error);
    }
  }

  async function handleOpenAccount() {
    const result = await withToken((idToken) => adminOpenAccount(idToken, uid, newAccountType));
    if (!result) return;
    if (result.ok) {
      toast.success("Account opened");
      setOpenAccountOpen(false);
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleSetAccountStatus(accountId: string, status: "active" | "frozen" | "closed") {
    const result = await withToken((idToken) => adminSetAccountStatus(idToken, accountId, status));
    if (!result) return;
    if (result.ok) {
      toast.success(`Account ${status}`);
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleMoneyAction() {
    if (!moneyAccountId || !moneyAmount) return;
    const numeric = Number(moneyAmount);
    const signedAmount = moneyMode === "withdraw" ? -Math.abs(numeric) : Math.abs(numeric);
    const result = await withToken((idToken) =>
      adminAdjustBalance(idToken, {
        accountId: moneyAccountId,
        amount: signedAmount,
        reason: moneyReason || moneyMode,
      })
    );
    if (!result) return;
    if (result.ok) {
      toast.success("Balance updated");
      setMoneyOpen(false);
      setMoneyAmount("");
      setMoneyReason("");
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleTransfer() {
    if (!transferFrom || !transferTo || !transferAmount) return;
    const result = await withToken((idToken) =>
      adminTransferFunds(idToken, {
        fromAccountId: transferFrom,
        toAccountId: transferTo,
        amount: Number(transferAmount),
        note: transferNote,
      })
    );
    if (!result) return;
    if (result.ok) {
      toast.success(`Transfer completed - ref ${result.reference}`);
      setTransferOpen(false);
      setTransferAmount("");
      setTransferNote("");
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleIssueCard() {
    if (!cardAccountId || !customer) return;
    const result = await withToken((idToken) =>
      adminIssueCard(idToken, {
        userId: uid,
        accountId: cardAccountId,
        type: cardType,
        network: cardNetwork,
        cardholderName: `${customer.firstName} ${customer.lastName}`,
      })
    );
    if (!result) return;
    if (result.ok) {
      toast.success("Card issued");
      setIssueCardOpen(false);
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleCardStatus(cardId: string, status: "active" | "frozen") {
    const result = await withToken((idToken) => adminSetCardStatus(idToken, cardId, status));
    if (!result) return;
    if (result.ok) {
      toast.success(status === "frozen" ? "Card frozen" : "Card unfrozen");
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  async function handleReplaceCard(cardId: string) {
    const result = await withToken((idToken) => adminReplaceCard(idToken, cardId));
    if (!result) return;
    if (result.ok) {
      toast.success("Card replaced");
      invalidateAll();
    } else {
      toast.error(result.error);
    }
  }

  const loading = usersLoading || accountsLoading || cardsLoading || txLoading;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/users" className="text-muted-foreground flex items-center gap-1 text-sm">
          <ArrowLeft className="size-3.5" /> Back to users
        </Link>
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/users" className="text-muted-foreground flex w-fit items-center gap-1 text-sm">
        <ArrowLeft className="size-3.5" /> Back to users
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback>{initials(`${customer.firstName} ${customer.lastName}`)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-muted-foreground text-sm">{customer.email}</p>
          </div>
          <Badge variant={customer.status === "active" ? "success" : customer.status === "suspended" ? "warning" : "destructive"} className="capitalize">
            {customer.status}
          </Badge>
          {customer.reviewStatus && (
            <Badge variant="outline" className="capitalize">
              {customer.reviewStatus}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {customer.reviewStatus === "pending" && (
            <>
              <Button size="sm" variant="outline" disabled={busy} onClick={handleReject}>
                Reject registration
              </Button>
              <Button size="sm" variant="gradient" disabled={busy} onClick={handleApprove}>
                Approve registration
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" disabled={busy} onClick={openEditProfile}>
            <Pencil className="size-3.5" /> Edit profile
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={handleToggleStatus}>
            {customer.status === "active" ? "Suspend" : "Reactivate"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setResetPinOpen(true)}>
            <KeyRound className="size-3.5" /> Reset PIN
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={handleResetPassword}>
            <Mail className="size-3.5" /> Send password reset
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setNotifyOpen(true)}>
            <Bell className="size-3.5" /> Notify
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => setDeleteOpen(true)}>
            Delete customer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4.5" /> Accounts
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)} disabled={accounts.length < 1}>
              Transfer
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMoneyOpen(true)} disabled={accounts.length === 0}>
              Deposit / withdraw
            </Button>
            <Button size="sm" variant="gradient" onClick={() => setOpenAccountOpen(true)}>
              <Plus className="size-3.5" /> Open account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No accounts.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => {
                  const status = a.status ?? "active";
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.accountNumber}</TableCell>
                      <TableCell>{formatCurrency(a.balance, a.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={accountStatusVariant[status]} className="capitalize">
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {status !== "closed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => handleSetAccountStatus(a.id, status === "frozen" ? "active" : "frozen")}
                            >
                              {status === "frozen" ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
                              {status === "frozen" ? "Unfreeze" : "Freeze"}
                            </Button>
                          )}
                          {status !== "closed" && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => handleSetAccountStatus(a.id, "closed")}>
                              Close
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4.5" /> Cards
          </CardTitle>
          <Button size="sm" variant="gradient" onClick={() => setIssueCardOpen(true)} disabled={accounts.length === 0}>
            <Plus className="size-3.5" /> Issue card
          </Button>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-muted-foreground text-sm">No cards.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((c) => (
                <div key={c.id} className="border-border/60 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm">{maskCardNumber(c.cardNumber)}</p>
                    <Badge variant={c.status === "active" ? "success" : "warning"} className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs capitalize">
                    {c.network} &middot; {c.type} &middot; expires {c.expiryMonth}/{c.expiryYear}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handleCardStatus(c.id, c.status === "frozen" ? "active" : "frozen")}
                    >
                      <Snowflake className="size-3.5" />
                      {c.status === "frozen" ? "Unfreeze" : "Freeze"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => handleReplaceCard(c.id)}>
                      Replace
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell className={tx.direction === "credit" ? "text-success" : ""}>
                      {tx.direction === "credit" ? "+" : "-"}
                      {formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="capitalize">{tx.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit customer profile (admin-only identity/KYC fields) */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit customer profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>First name</Label>
              <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Last name</Label>
              <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone number</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date of birth</Label>
              <Input type="date" value={editDateOfBirth} onChange={(e) => setEditDateOfBirth(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Occupation</Label>
              <Input value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProfile} disabled={busy} variant="gradient" className="w-full">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset PIN confirmation */}
      <AlertDialog open={resetPinOpen} onOpenChange={setResetPinOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset transaction PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears {customer.firstName}&apos;s current PIN. They will need to set a new one
              before they can transfer funds again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPin}>Reset PIN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {customer.firstName} {customer.lastName}&apos;s authentication
              record and profile. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete customer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send notification */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send notification</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Message</Label>
              <Input value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendNotification} disabled={busy} variant="gradient" className="w-full">
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open account */}
      <Dialog open={openAccountOpen} onOpenChange={setOpenAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open additional account</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Account type</Label>
            <Select value={newAccountType} onValueChange={(v) => setNewAccountType(v as AccountType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleOpenAccount} disabled={busy} variant="gradient" className="w-full">
              Open account (starts at $0.00)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit / withdraw / adjust */}
      <Dialog open={moneyOpen} onOpenChange={setMoneyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit, withdraw or adjust balance</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Account</Label>
              <Select value={moneyAccountId} onValueChange={setMoneyAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} &middot; {formatCurrency(a.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={moneyMode} onValueChange={(v) => setMoneyMode(v as typeof moneyMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdraw">Withdraw</SelectItem>
                  <SelectItem value="adjust">Manual adjustment (+/-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(e.target.value)}
                placeholder={moneyMode === "adjust" ? "100 or -50" : "100"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reason</Label>
              <Input value={moneyReason} onChange={(e) => setMoneyReason(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleMoneyAction} disabled={busy} variant="gradient" className="w-full">
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer between this customer's accounts / to another account */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin transfer</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>From account</Label>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} &middot; {formatCurrency(a.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>To account ID</Label>
              <Input
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Any account ID (this or another customer)"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Amount</Label>
              <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Note</Label>
              <Input value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleTransfer} disabled={busy} variant="gradient" className="w-full">
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue card */}
      <Dialog open={issueCardOpen} onOpenChange={setIssueCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue new card</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Linked account</Label>
              <Select value={cardAccountId} onValueChange={setCardAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={cardType} onValueChange={(v) => setCardType(v as typeof cardType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Network</Label>
              <Select value={cardNetwork} onValueChange={(v) => setCardNetwork(v as typeof cardNetwork)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="verve">Verve</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleIssueCard} disabled={busy} variant="gradient" className="w-full">
              Issue card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
