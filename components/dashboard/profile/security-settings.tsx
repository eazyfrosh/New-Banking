"use client";

import * as React from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { auth } from "@/lib/firebase/client";
import { setTransactionPin } from "@/lib/actions/profile-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SecuritySettings({ userId }: { userId: string }) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [passwordSubmitting, setPasswordSubmitting] = React.useState(false);

  const [pin, setPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [pinSubmitting, setPinSubmitting] = React.useState(false);

  async function handlePasswordChange() {
    if (!auth.currentUser?.email) return;
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setPasswordSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Could not update password. Check your current password.");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  async function handlePinChange() {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }
    setPinSubmitting(true);
    const result = await setTransactionPin(userId, pin);
    setPinSubmitting(false);
    if (result.ok) {
      toast.success("Transaction PIN updated");
      setPin("");
      setConfirmPin("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4.5" />
            Change password
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Current password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button onClick={handlePasswordChange} disabled={passwordSubmitting} variant="gradient" className="w-fit">
            {passwordSubmitting && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4.5" />
            Transaction PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Your transaction PIN is required to authorize transfers and reveal card details.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>New PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center tracking-[0.5em]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="text-center tracking-[0.5em]"
              />
            </div>
          </div>
          <Button onClick={handlePinChange} disabled={pinSubmitting} variant="gradient" className="w-fit">
            Update PIN
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
