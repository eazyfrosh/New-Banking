"use client";

import * as React from "react";
import { ArrowRightLeft, Loader2, Plus, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { convertCurrency, openCurrencyAccount, previewConversion } from "@/lib/actions/currency-actions";
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyInfo } from "@/lib/currencies";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AccountType } from "@/types";

import { AccountCard } from "@/components/dashboard/account-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const accountTypeLabels: Record<AccountType, string> = {
  current: "Current account",
  savings: "Savings account",
  fixed_deposit: "Fixed deposit",
};

export default function CurrencyPage() {
  const { profile } = useAuth();
  const { data: accounts, loading: accountsLoading } = useAccounts(profile?.uid);
  const displayCurrency = profile?.currency || DEFAULT_CURRENCY;

  const {
    data: rates,
    isLoading: ratesLoading,
    isFetching: ratesFetching,
    refetch: refetchRates,
  } = useExchangeRates(displayCurrency);

  const balancesByCurrency = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const acc of accounts) {
      map.set(acc.currency, (map.get(acc.currency) ?? 0) + acc.balance);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [accounts]);

  const totalInDisplayCurrency = React.useMemo(() => {
    if (!rates) return null;
    let sum = 0;
    for (const [currency, total] of balancesByCurrency) {
      if (currency === rates.base) {
        sum += total;
        continue;
      }
      const rate = rates.rates[currency];
      if (!rate) continue;
      sum += total / rate;
    }
    return sum;
  }, [balancesByCurrency, rates]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Currency &amp; Conversion</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Hold balances in multiple currencies and convert between them at live rates.
          </p>
        </div>
        <OpenCurrencyAccountDialog userId={profile?.uid} existingAccounts={accounts} />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Total balance (in {displayCurrency})</p>
            <p className="text-2xl font-semibold">
              {totalInDisplayCurrency === null ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(totalInDisplayCurrency, displayCurrency)
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {balancesByCurrency.map(([currency, total]) => {
              const info = getCurrencyInfo(currency);
              return (
                <Badge key={currency} variant="secondary" className="gap-1 py-1">
                  <span>{info.flag}</span>
                  {formatCurrency(total, currency)}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Your accounts</h2>
        {accountsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState icon={Wallet} title="No accounts yet" description="Open your first currency account to get started." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConverterCard userId={profile?.uid} accounts={accounts} />

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Live exchange rates</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetchRates()}
              disabled={ratesFetching}
              aria-label="Refresh rates"
            >
              <RefreshCw className={ratesFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </CardHeader>
          <CardContent>
            {ratesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : rates ? (
              <>
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Base: {getCurrencyInfo(rates.base).flag} {rates.base} &middot; as of {formatDate(rates.fetchedAt)}
                  </span>
                  <Badge variant={rates.live ? "success" : "warning"}>
                    {rates.live ? "Live" : "Estimated"}
                  </Badge>
                </div>
                <div className="divide-border/60 max-h-80 divide-y overflow-y-auto">
                  {CURRENCIES.filter((c) => c.code !== rates.base).map((c) => {
                    const rate = rates.rates[c.code];
                    return (
                      <div key={c.code} className="flex items-center justify-between py-2 text-sm">
                        <span className="font-medium">
                          {c.flag} {rates.base}/{c.code}
                        </span>
                        <span className="text-muted-foreground">{rate ? rate.toFixed(4) : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OpenCurrencyAccountDialog({
  userId,
  existingAccounts,
}: {
  userId: string | undefined;
  existingAccounts: { currency: string; type: AccountType }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [currency, setCurrency] = React.useState(CURRENCIES[0].code);
  const [type, setType] = React.useState<AccountType>("current");
  const [submitting, setSubmitting] = React.useState(false);

  const existingKey = new Set(existingAccounts.map((a) => `${a.currency}:${a.type}`));
  const alreadyExists = existingKey.has(`${currency}:${type}`);

  async function handleCreate() {
    if (!userId) return;
    setSubmitting(true);
    try {
      const result = await openCurrencyAccount(userId, currency, type);
      if (result.ok) {
        toast.success(`${currency} ${accountTypeLabels[type].toLowerCase()} opened`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" />
          Open currency account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a new currency account</DialogTitle>
          <DialogDescription>Hold a dedicated balance in another currency, ready to convert or spend.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.code} &middot; {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Account type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current account</SelectItem>
                <SelectItem value="savings">Savings account</SelectItem>
                <SelectItem value="fixed_deposit">Fixed deposit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {alreadyExists && (
            <p className="text-destructive text-xs">
              You already have a {currency} {accountTypeLabels[type].toLowerCase()}.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={submitting || alreadyExists || !userId}
            variant="gradient"
            className="w-full"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Open account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AccountLike {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

function ConverterCard({ userId, accounts }: { userId: string | undefined; accounts: AccountLike[] }) {
  const [fromAccountId, setFromAccountId] = React.useState("");
  const [toAccountId, setToAccountId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [pinOpen, setPinOpen] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [preview, setPreview] = React.useState<
    { rate: number; fee: number; creditAmount: number; live: boolean } | null
  >(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // Derived (not stored) so the first account and an invalidated "to"
  // selection resolve automatically without setState-in-effect.
  const effectiveFromId = fromAccountId || accounts[0]?.id || "";
  const fromAccount = accounts.find((a) => a.id === effectiveFromId);
  const otherCurrencyAccounts = accounts.filter((a) => a.currency !== fromAccount?.currency);
  const effectiveToId = otherCurrencyAccounts.some((a) => a.id === toAccountId)
    ? toAccountId
    : (otherCurrencyAccounts[0]?.id ?? "");
  const toAccount = accounts.find((a) => a.id === effectiveToId);

  React.useEffect(() => {
    const amt = Number(amount);
    const valid = !!fromAccount && !!toAccount && !!amt && amt > 0;

    const handle = setTimeout(
      async () => {
        if (!valid || !fromAccount || !toAccount) {
          setPreview(null);
          setPreviewError(null);
          setPreviewLoading(false);
          return;
        }
        setPreviewLoading(true);
        const result = await previewConversion(fromAccount.currency, toAccount.currency, amt);
        if (result.ok) {
          setPreview({ rate: result.rate, fee: result.fee, creditAmount: result.creditAmount, live: result.live });
          setPreviewError(null);
        } else {
          setPreview(null);
          setPreviewError(result.error);
        }
        setPreviewLoading(false);
      },
      valid ? 400 : 0
    );
    return () => clearTimeout(handle);
  }, [amount, fromAccount, toAccount]);

  async function handleConvert() {
    if (!userId || !fromAccount || !toAccount) return;
    setSubmitting(true);
    try {
      const result = await convertCurrency({
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: Number(amount),
        pin,
      });
      if (result.ok) {
        toast.success(`Converted ${formatCurrency(Number(amount), fromAccount.currency)} to ${formatCurrency(result.creditAmount, result.toCurrency)}`);
        setPinOpen(false);
        setPin("");
        setAmount("");
        setPreview(null);
      } else {
        toast.error(result.error);
        setPin("");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  if (accounts.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Convert currency</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ArrowRightLeft}
            title="Open a second currency account"
            description="You need at least two accounts in different currencies to convert between them."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convert currency</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>From</Label>
          <Select value={effectiveFromId} onValueChange={setFromAccountId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select account" />
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
          <Label>To</Label>
          <Select value={effectiveToId} onValueChange={setToAccountId} disabled={otherCurrencyAccounts.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {otherCurrencyAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} &middot; {getCurrencyInfo(a.currency).flag} {a.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Amount ({fromAccount?.currency ?? "—"})</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {previewLoading && <Skeleton className="h-20 w-full" />}

        {!previewLoading && previewError && <p className="text-destructive text-sm">{previewError}</p>}

        {!previewLoading && preview && fromAccount && toAccount && (
          <div className="bg-muted/50 flex flex-col gap-2 rounded-xl p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange rate</span>
              <span className="font-medium">
                1 {fromAccount.currency} = {preview.rate.toFixed(4)} {toAccount.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion fee (0.5%)</span>
              <span className="font-medium">{formatCurrency(preview.fee, fromAccount.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You&apos;ll receive</span>
              <span className="font-semibold">{formatCurrency(preview.creditAmount, toAccount.currency)}</span>
            </div>
            {!preview.live && (
              <p className="text-warning text-xs">
                Live rates are temporarily unavailable - this uses an estimated rate.
              </p>
            )}
          </div>
        )}

        <Button
          variant="gradient"
          size="lg"
          disabled={!preview || !fromAccount || !toAccount}
          onClick={() => setPinOpen(true)}
        >
          <ArrowRightLeft className="size-4" />
          Convert
        </Button>
      </CardContent>

      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm transaction PIN</DialogTitle>
            <DialogDescription>
              Enter your 4-digit PIN to authorize converting{" "}
              {fromAccount && formatCurrency(Number(amount), fromAccount.currency)}.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            className="text-center text-2xl tracking-[0.5em]"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
          <DialogFooter>
            <Button
              onClick={handleConvert}
              disabled={submitting || pin.length !== 4}
              variant="gradient"
              className="w-full"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              <ShieldCheck className="size-4" />
              Authorize conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
