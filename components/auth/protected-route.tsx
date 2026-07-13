"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

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
  const { user, profile, loading, profileError, signOut } = useAuth();
  const [stuck, setStuck] = React.useState(false);

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

  const cannotLoadProfile = !loading && user && !profile && (profileError || stuck);

  if (cannotLoadProfile) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-2xl">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <p className="font-medium">We couldn&apos;t load your account</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            A browser extension (ad blocker or privacy tool) may be blocking a secure connection
            to our database. Try disabling it for this site, or check your connection, then
            retry.
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
