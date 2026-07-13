"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { payBill } from "@/lib/actions/bill-actions";
import { BILL_PROVIDERS } from "@/lib/services/bills";
import { billCategories, billCategoryIcons, billCategoryLabels } from "@/lib/bill-meta";
import { cn, formatCurrency } from "@/lib/utils";
import type { Account, BillCategory } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PayBillForm({ userId, accounts }: { userId: string; accounts: Account[] }) {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as BillCategory) || "electricity";

  const [category, setCategory] = React.useState<BillCategory>(initialCategory);
  const [provider, setProvider] = React.useState(BILL_PROVIDERS[initialCategory][0]?.name ?? "");
  const [accountReference, setAccountReference] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  function selectCategory(cat: BillCategory) {
    setCategory(cat);
    setProvider(BILL_PROVIDERS[cat][0]?.name ?? "");
  }

  async function handlePay() {
    if (!accountId || !provider || !accountReference || !amount) {
      toast.error("Fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await payBill({
        userId,
        accountId,
        category,
        provider,
        accountReference,
        amount: Number(amount),
      });
      if (result.ok) {
        toast.success("Payment successful");
        setAccountReference("");
        setAmount("");
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
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {billCategories.map((cat) => {
              const Icon = billCategoryIcons[cat];
              return (
                <button
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors",
                    category === cat
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-muted"
                  )}
                >
                  <Icon className="size-4.5" />
                  {billCategoryLabels[cat]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILL_PROVIDERS[category].map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {category === "airtime" || category === "data" ? "Phone number" : "Account / meter number"}
            </Label>
            <Input value={accountReference} onChange={(e) => setAccountReference(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Pay from</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} &middot; {formatCurrency(account.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handlePay} disabled={submitting} variant="gradient" size="lg">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Pay {amount ? formatCurrency(Number(amount)) : ""}
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardContent className="space-y-3 text-sm">
          <h3 className="font-semibold">Good to know</h3>
          <p className="text-muted-foreground">
            Bill payments are processed instantly and can&apos;t be reversed. Double-check your
            account or meter number before confirming.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
