import Link from "next/link";
import {
  ArrowLeftRight,
  Receipt,
  Smartphone,
  Wifi,
} from "lucide-react";

const actions = [
  { href: "/dashboard/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/dashboard/bills", label: "Pay bills", icon: Receipt },
  { href: "/dashboard/bills?category=airtime", label: "Buy airtime", icon: Smartphone },
  { href: "/dashboard/bills?category=data", label: "Buy data", icon: Wifi },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="border-border/60 bg-card hover:border-primary/40 hover:shadow-md flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all"
        >
          <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
            <action.icon className="size-5" />
          </span>
          <span className="text-xs font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
