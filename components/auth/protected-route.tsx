"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: UserRole;
}) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

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
