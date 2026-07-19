"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { MailCheck, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function VerifyEmailPanel() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sending, setSending] = React.useState(false);
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  async function resend() {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent.");
    } catch (error) {
      console.error("sendEmailVerification (resend) failed:", error);
      const code = error instanceof Error && "code" in error ? String((error as { code: string }).code) : "";
      toast.error(
        code === "auth/too-many-requests"
          ? "Too many requests - please wait a few minutes before trying again."
          : "Could not send email right now. Try again shortly."
      );
    } finally {
      setSending(false);
    }
  }

  async function checkVerified() {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;
    setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        toast.success("Email verified!");
        router.push("/dashboard");
      } else {
        toast.info("Not verified yet. Check your inbox.");
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
        <MailCheck className="size-5" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          We sent a verification link to <strong>{user?.email}</strong>. Click the link, then
          return here to continue.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button onClick={checkVerified} disabled={checking} variant="gradient">
          <RefreshCcw className="size-4" />
          I&apos;ve verified
        </Button>
        <Button onClick={resend} disabled={sending} variant="outline">
          Resend email
        </Button>
      </div>
    </div>
  );
}
