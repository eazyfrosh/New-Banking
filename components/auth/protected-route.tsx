"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: UserRole;
}) {
  const router = useRouter();
  const { user, profile, loading, profileMissing, profileError, retryProfileSetup, signOut } = useAuth();
  const [stuck, setStuck] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!user.emailVerified) {
      router.replace("/verify-email");
      return;
    }

    if (requiredRole && profile && profile.role !== requiredRole) {
      router.replace(profile.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [loading, user, profile, requiredRole, router]);

  React.useEffect(() => {
    if (!user || profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the stuck flag once the profile arrives or the user signs out
      setStuck(false);
      return;
    }
    const timer = setTimeout(() => setStuck(true), 8000);
    return () => clearTimeout(timer);
  }, [user, profile]);

  async function handleCompleteSetup() {
    setRetrying(true);
    try {
      const result = await retryProfileSetup();
      if (result.ok) {
        toast.success("Account setup complete.");
      } else {
        toast.error(result.error || "Could not complete account setup. Please try again.");
      }
    } catch (err) {
      // retryProfileSetup already catches its own errors, but this is a
      // last-resort net so the button can never be left spinning forever
      // no matter what fails.
      console.error("[ProtectedRoute] handleCompleteSetup threw:", err);
      toast.error(err instanceof Error ? err.message : "Unexpected error completing setup.");
    } finally {
      setRetrying(false);
    }
  }

  // Confirmed via a successful read: no profile document exists for this account
  // (most commonly because a prior registration attempt didn't finish setting it up).
  if (!loading && user && user.emailVerified && profileMissing) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="bg-warning/15 text-warning flex size-12 items-center justify-center rounded-2xl">
          <UserPlus className="size-5" />
        </span>
        <div>
          <p className="font-medium">Your account setup didn&apos;t finish</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            You&apos;re signed in, but we couldn&apos;t find your account profile. This can
            happen if registration was interrupted. Click below to finish setting it up.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => signOut().then(() => router.replace("/login"))}>
            Sign out
          </Button>
          <Button variant="gradient" onClick={handleCompleteSetup} disabled={retrying}>
            {retrying && <Loader2 className="size-4 animate-spin" />}
            Complete setup
          </Button>
        </div>
      </div>
    );
  }

  // A read actually failed (network/permission/unavailable/etc) — show the real error.
  if (!loading && user && user.emailVerified && profileError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-2xl">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <p className="font-medium">We couldn&apos;t load your account</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {"code" in profileError && profileError.code
              ? `Firestore error: ${profileError.code}`
              : profileError.message || "An unexpected error occurred while loading your data."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => signOut().then(() => router.replace("/login"))}>
            Sign out
          </Button>
          <Button variant="gradient" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Neither confirmed missing nor a hard error — but nothing has resolved in a
  // reasonable time. Last-resort fallback so the user isn't staring at a blank
  // skeleton forever with zero information.
  if (!loading && user && user.emailVerified && !profile && stuck) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <p className="font-medium">This is taking longer than expected</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            We&apos;re still trying to load your account data. This can be caused by a slow or
            restricted network connection.
          </p>
        </div>
        <Button variant="gradient" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loading || !user || !profile || (requiredRole && profile.role !== requiredRole)) {
    return (
      <div className="flex min-h-svh flex-col gap-4 p-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
