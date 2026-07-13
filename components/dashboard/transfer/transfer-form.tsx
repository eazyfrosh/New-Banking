"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { transferFunds, type TransferKind } from "@/lib/actions/transfer-actions";
import { transferSchema, pinSchema, type TransferValues, type PinValues } from "@/lib/validations/transfer";
import { formatCurrency, maskAccountNumber } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Step = "form" | "preview" | "receipt";

export function TransferForm() {
  const { profile } = useAuth();
  const { data: accounts } = useAccounts(profile?.uid);
  const [step, setStep] = React.useState<Step>("form");
  const [pinOpen, setPinOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [receipt, setReceipt] = React.useState<{ reference: string; status: string } | null>(null);

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      kind: "internal",
      amount: "",
      recipientName: "",
      recipientAccount: "",
      recipientBank: "",
      swiftCode: "",
      note: "",
    },
  });

  const pinForm = useForm<PinValues>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "" },
  });

  const kind = useWatch({ control: form.control, name: "kind" });
  const values = form.getValues();
  const selectedAccount = accounts.find((a) => a.id === values.fromAccountId);

  function goToPreview(data: TransferValues) {
    void data;
    setStep("preview");
  }

  async function confirmWithPin(pinValues: PinValues) {
    if (!profile) return;
    setSubmitting(true);
    try {
      const data = form.getValues();
      const result = await transferFunds({
        userId: profile.uid,
        fromAccountId: data.fromAccountId,
        kind: data.kind as TransferKind,
        amount: Number(data.amount),
        pin: pinValues.pin,
        recipientName: data.recipientName,
        recipientAccount: data.recipientAccount,
        recipientBank: data.recipientBank,
        swiftCode: data.swiftCode,
        note: data.note,
      });

      if (!result.ok) {
        toast.error(result.error);
        pinForm.reset();
        return;
      }

      setReceipt({ reference: result.reference, status: result.status });
      setPinOpen(false);
      setStep("receipt");
      toast.success("Transfer submitted successfully");
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    form.reset();
    pinForm.reset();
    setReceipt(null);
    setStep("form");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardContent>
          {step === "form" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(goToPreview)} className="flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transfer type</FormLabel>
                      <Tabs value={field.value} onValueChange={field.onChange}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="internal">Internal</TabsTrigger>
                          <TabsTrigger value="bank">Bank transfer</TabsTrigger>
                          <TabsTrigger value="international">International</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} &middot; {formatCurrency(account.balance)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipientAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {kind === "internal" ? "Recipient account number" : "Account / IBAN number"}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="0123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {kind !== "internal" && (
                  <FormField
                    control={form.control}
                    name="recipientBank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. First National Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {kind === "international" && (
                  <FormField
                    control={form.control}
                    name="swiftCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SWIFT / BIC code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. NEXOUS33" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What's this for?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" variant="gradient">
                  Review transfer
                </Button>
              </form>
            </Form>
          )}

          {step === "preview" && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold">Review your transfer</h2>
              <div className="divide-border/60 divide-y text-sm">
                {[
                  ["From", selectedAccount?.name ?? ""],
                  ["Amount", formatCurrency(Number(values.amount))],
                  ["Recipient", values.recipientName],
                  ["Account", values.recipientAccount],
                  ...(values.recipientBank ? [["Bank", values.recipientBank]] : []),
                  ...(values.swiftCode ? [["SWIFT/BIC", values.swiftCode]] : []),
                  ["Note", values.note || "—"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                  Back
                </Button>
                <Button variant="gradient" onClick={() => setPinOpen(true)} className="flex-1">
                  <ShieldCheck className="size-4" />
                  Confirm with PIN
                </Button>
              </div>
            </div>
          )}

          {step === "receipt" && receipt && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="bg-success/10 text-success flex size-14 items-center justify-center rounded-full">
                <CheckCircle2 className="size-7" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  {receipt.status === "completed" ? "Transfer successful" : "Transfer submitted"}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {receipt.status === "completed"
                    ? "Your money is on its way."
                    : "Your transfer is pending review and will complete shortly."}
                </p>
              </div>

              <Card className="w-full max-w-sm text-left">
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono font-medium">{receipt.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatCurrency(Number(values.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">{values.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">{maskAccountNumber(values.recipientAccount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">{receipt.status}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex w-full max-w-sm gap-3">
                <Button variant="outline" onClick={() => window.print()} className="flex-1">
                  Print receipt
                </Button>
                <Button variant="gradient" onClick={startOver} className="flex-1">
                  New transfer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardContent className="space-y-3 text-sm">
          <h3 className="font-semibold">Transfer tips</h3>
          <p className="text-muted-foreground">
            Internal transfers are instant. Bank and international transfers may take up to 24
            hours and include a small processing fee.
          </p>
          <p className="text-muted-foreground">
            Never share your transaction PIN with anyone, including Nexora staff.
          </p>
        </CardContent>
      </Card>

      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm transaction PIN</DialogTitle>
            <DialogDescription>
              Enter your 4-digit PIN to authorize this transfer of{" "}
              {formatCurrency(Number(values.amount))}.
            </DialogDescription>
          </DialogHeader>
          <Form {...pinForm}>
            <form onSubmit={pinForm.handleSubmit(confirmWithPin)} className="flex flex-col gap-4">
              <FormField
                control={pinForm.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="••••"
                        className="text-center text-2xl tracking-[0.5em]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" variant="gradient" disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Authorize transfer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
