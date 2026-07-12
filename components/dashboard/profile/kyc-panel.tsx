"use client";

import * as React from "react";
import { CheckCircle2, Clock, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import { submitKyc } from "@/lib/actions/profile-actions";
import { uploadUserFile } from "@/lib/services/storage";
import type { KycStatus, UserProfile } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const statusMeta: Record<KycStatus, { label: string; variant: "success" | "warning" | "destructive" | "secondary"; icon: typeof CheckCircle2 }> = {
  verified: { label: "Verified", variant: "success", icon: CheckCircle2 },
  pending: { label: "Pending review", variant: "warning", icon: Clock },
  rejected: { label: "Rejected", variant: "destructive", icon: ShieldAlert },
  unverified: { label: "Not verified", variant: "secondary", icon: ShieldAlert },
};

export function KycPanel({ profile }: { profile: UserProfile }) {
  const [idFile, setIdFile] = React.useState<File | null>(null);
  const [billFile, setBillFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const meta = statusMeta[profile.kycStatus];

  async function handleSubmit() {
    if (!idFile || !billFile) {
      toast.error("Please upload both documents.");
      return;
    }
    setSubmitting(true);
    try {
      const [idUrl, billUrl] = await Promise.all([
        uploadUserFile(profile.uid, "kyc", idFile),
        uploadUserFile(profile.uid, "kyc", billFile),
      ]);
      const result = await submitKyc({ userId: profile.uid, idDocumentUrl: idUrl, utilityBillUrl: billUrl });
      if (result.ok) toast.success("Documents submitted for review");
      else toast.error(result.error);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Identity verification</h3>
          <Badge variant={meta.variant}>
            <meta.icon className="size-3.5" />
            {meta.label}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm">
          Upload a government-issued ID and a recent utility bill to unlock full account limits.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="border-border/60 hover:bg-muted/40 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm">
            <Upload className="text-muted-foreground size-5" />
            {idFile ? idFile.name : "Upload ID document"}
            <input
              type="file"
              accept="image/*,.pdf"
              hidden
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="border-border/60 hover:bg-muted/40 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm">
            <Upload className="text-muted-foreground size-5" />
            {billFile ? billFile.name : "Upload utility bill"}
            <input
              type="file"
              accept="image/*,.pdf"
              hidden
              onChange={(e) => setBillFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || profile.kycStatus === "pending" || profile.kycStatus === "verified"}
          variant="gradient"
          className="w-fit"
        >
          Submit for review
        </Button>
      </CardContent>
    </Card>
  );
}
