"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/dashboard/app-shell";
import { customerNav } from "@/lib/nav-config";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="customer">
      <AppShell navItems={customerNav} roleLabel="Customer">
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
