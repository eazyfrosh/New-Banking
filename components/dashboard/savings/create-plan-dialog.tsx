"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createSavingsPlan } from "@/lib/actions/savings-actions";
import type { Account, SavingsPlanType } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const interestByType: Record<SavingsPlanType, number> = {
  flexible: 4.5,
  target: 5.2,
  fixed_deposit: 7.2,
};

export function CreatePlanDialog({
  userId,
  accounts,
}: {
  userId: string;
  accounts: Account[];
}) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<SavingsPlanType>("flexible");
  const [name, setName] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState("");
  const [initialDeposit, setInitialDeposit] = React.useState("");
  const [fundingAccountId, setFundingAccountId] = React.useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleCreate() {
    if (!name || !fundingAccountId) return;
    setSubmitting(true);
    const result = await createSavingsPlan({
      userId,
      type,
      name,
      targetAmount: type === "target" ? Number(targetAmount) : undefined,
      interestRate: interestByType[type],
      initialDeposit: Number(initialDeposit || 0),
      fundingAccountId,
      endDate:
        type === "fixed_deposit"
          ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString()
          : undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Savings plan created");
      setOpen(false);
      setName("");
      setTargetAmount("");
      setInitialDeposit("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" />
          New savings plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a savings plan</DialogTitle>
          <DialogDescription>Choose a plan type and start growing your money.</DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as SavingsPlanType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flexible">Flexible</TabsTrigger>
            <TabsTrigger value="target">Target</TabsTrigger>
            <TabsTrigger value="fixed_deposit">Fixed deposit</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Plan name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "fixed_deposit" ? "6-month deposit" : "New MacBook fund"}
            />
          </div>

          {type === "target" && (
            <div className="flex flex-col gap-1.5">
              <Label>Target amount</Label>
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="3000"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Initial deposit</Label>
            <Input
              type="number"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              placeholder="100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Funding account</Label>
            <Select value={fundingAccountId} onValueChange={setFundingAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-muted-foreground text-xs">
            Interest rate: <span className="font-medium">{interestByType[type]}% APY</span>
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={submitting || !name} variant="gradient" className="w-full">
            Create plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
