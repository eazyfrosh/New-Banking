import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, TrendingUp, Zap } from "lucide-react";

import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Account Access",
};

const highlights = [
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    description: "Encrypted end-to-end with real-time fraud monitoring.",
  },
  {
    icon: Zap,
    title: "Instant transfers",
    description: "Move money between accounts and banks in seconds.",
  },
  {
    icon: TrendingUp,
    title: "Grow your wealth",
    description: "Savings, loans and investments in a single dashboard.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-8 px-6 py-10 sm:px-12 lg:px-16">
        <Logo />
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} Novaofficial. All rights reserved.{" "}
          <Link href="/" className="underline underline-offset-4">
            Back to home
          </Link>
        </p>
      </div>

      <div className="bg-mesh relative hidden overflow-hidden bg-primary/5 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="glass max-w-md rounded-3xl p-8">
          <p className="text-2xl font-semibold tracking-tight text-balance">
            Banking that feels effortless, secure, and genuinely yours.
          </p>
          <div className="mt-8 flex flex-col gap-6">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
