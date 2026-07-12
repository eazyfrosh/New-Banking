"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useTransactions } from "@/hooks/use-transactions";
import { customerNav, adminNav } from "@/lib/nav-config";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DashboardSearch() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { data: transactions } = useTransactions(user?.uid);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const navItems = pathname.startsWith("/admin") ? adminNav : customerNav;

  const matchedNav = query
    ? navItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  const matchedTx = query
    ? transactions
        .filter(
          (tx) =>
            tx.description.toLowerCase().includes(query.toLowerCase()) ||
            tx.reference.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <Popover open={open && query.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative hidden w-full max-w-sm sm:block">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder={`Search ${profile?.role === "admin" ? "admin" : "your account"}...`}
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {matchedNav.length === 0 && matchedTx.length === 0 ? (
          <p className="text-muted-foreground p-3 text-sm">No results for &ldquo;{query}&rdquo;</p>
        ) : (
          <div className="flex flex-col gap-1">
            {matchedNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setQuery("")}
                className="hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
            {matchedTx.map((tx) => (
              <div key={tx.id} className="hover:bg-muted flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                <span className="truncate">{tx.description}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatCurrency(tx.amount, tx.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
