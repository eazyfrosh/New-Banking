"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/dashboard/app-shell";
import { adminNav } from "@/lib/nav-config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppShell navItems={adminNav} roleLabel="Admin">
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
