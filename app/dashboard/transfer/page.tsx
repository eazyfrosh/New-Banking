import type { Metadata } from "next";

import { TransferForm } from "@/components/dashboard/transfer/transfer-form";

export const metadata: Metadata = { title: "Transfer Money" };

export default function TransferPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transfer money</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Send money instantly within Novaofficial, to any bank, or internationally.
        </p>
      </div>
      <TransferForm />
    </div>
  );
}
