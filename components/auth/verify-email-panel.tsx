"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { MailCheck, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { getFirebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

/** Every field Firebase Auth errors can carry - logged in full so a vague
 * production failure is never reduced to a single generic toast again. */
function logFirebaseError(context: string, error: unknown) {
  if (error && typeof error === "object") {
    const err = error as { code?: string; message?: string; name?: string; customData?: unknown };
    console.error(`[VerifyEmailPanel] ${context}:`, {
      code: err.code,
      message: err.message,
      name: err.name,
      customData: err.customData,
      raw: error,
    });
  } else {
    console.error(`[VerifyEmailPanel] ${context}:`, error);
  }
}

function errorCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error ? String((error as { code: string }).code) : "";
}

function resendErrorMessage(code: string): string {
  switch (code) {
    case "auth/too-many-requests":
      return "Too many requests - please wait a few minutes before trying again.";
    case "auth/user-token-expired":
    case "auth/invalid-user-token":
    case "auth/user-disabled":
      return "Your session has expired. Please sign in again.";
    case "auth/network-request-failed":
      return "Network error reaching Firebase. Check your connection and try again.";
    case "auth/internal-error":
      return "Firebase couldn't send the email right now (this usually clears up on its own - try again shortly).";
    default:
      return code ? `Could not send email right now (${code}).` : "Could not send email right now. Try again shortly.";
  }
}

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
    // 1. Env vars present at all, before touching the SDK.
    if (!isFirebaseClientConfigured()) {
      console.error("[VerifyEmailPanel] resend aborted: Firebase client env vars are missing in this environment.");
      toast.error("Email service is not configured on this deployment. Contact support.");
      return;
    }

    setSending(true);
    try {
      // 2. getFirebaseAuth() itself can throw (invalid config) - keep it
      // inside the try/catch so that surfaces through the same logging
      // and toast path instead of an unhandled rejection.
      const auth = getFirebaseAuth();

      // 3. Confirm this is really the auth instance for this project, and
      // log it so a mismatched/duplicate Firebase app is visible immediately.
      console.log("[VerifyEmailPanel] resend using Firebase project:", auth.app.options.projectId, "app:", auth.app.name);

      // 4. Current user must actually be authenticated before calling
      // sendEmailVerification - and force a token refresh so a stale/expired
      // session fails with a clear, specific error here instead of an
      // opaque one from sendEmailVerification itself.
      if (!auth.currentUser) {
        console.error("[VerifyEmailPanel] resend aborted: no authenticated user (auth.currentUser is null).");
        toast.error("You're not signed in. Please sign in again.");
        return;
      }
      await auth.currentUser.getIdToken(true);

      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent.");
    } catch (error) {
      logFirebaseError("sendEmailVerification (resend) failed", error);
      toast.error(resendErrorMessage(errorCode(error)));
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
