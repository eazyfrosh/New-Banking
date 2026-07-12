"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { DashboardSearch } from "@/components/dashboard/dashboard-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/nav-config";

export function AppShell({
  children,
  navItems,
  roleLabel,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  roleLabel: string;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="bg-background flex min-h-svh">
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border/60 p-4 lg:flex">
        <div className="flex items-center justify-between px-2 py-2">
          <Logo className="text-sidebar-foreground" />
        </div>
        <Badge variant="secondary" className="mx-2 mt-1 w-fit">
          {roleLabel}
        </Badge>
        <div className="mt-6 flex-1 overflow-y-auto">
          <SidebarNav items={navItems} />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-sidebar text-sidebar-foreground w-72 p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo className="text-sidebar-foreground px-2 py-2" />
          <Badge variant="secondary" className="mx-2 mt-1 w-fit">
            {roleLabel}
          </Badge>
          <div className="mt-6">
            <SidebarNav items={navItems} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          <DashboardSearch />

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
