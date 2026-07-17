import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BadgeDollarSign,
  Bell,
  Coins,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LineChart,
  Megaphone,
  PiggyBank,
  Receipt,
  ScrollText,
  Settings,
  ShieldAlert,
  TicketCheck,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const customerNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/dashboard/currency", label: "Currency", icon: Coins },
  { href: "/dashboard/transactions", label: "Transactions", icon: Receipt },
  { href: "/dashboard/cards", label: "Cards", icon: CreditCard },
  { href: "/dashboard/savings", label: "Savings", icon: PiggyBank },
  { href: "/dashboard/loans", label: "Loans", icon: BadgeDollarSign },
  { href: "/dashboard/investments", label: "Investments", icon: LineChart },
  { href: "/dashboard/bills", label: "Bills", icon: Wallet },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: Settings },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/loans", label: "Loans", icon: BadgeDollarSign },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/support", label: "Support tickets", icon: TicketCheck },
  { href: "/admin/fraud", label: "Fraud alerts", icon: ShieldAlert },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
];
