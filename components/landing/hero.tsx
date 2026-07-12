"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/shared/animated-counter";

export function Hero() {
  return (
    <section className="bg-mesh relative overflow-hidden px-6 pt-16 pb-24 sm:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-border/60 bg-card/60 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur"
          >
            <Sparkles className="text-accent size-3.5" />
            Trusted by 2M+ people worldwide
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Banking, reimagined for how you actually live.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground mt-6 max-w-lg text-lg text-balance"
          >
            One elegant app for spending, saving, investing and borrowing —
            with instant transfers, smart insights, and security built into
            every tap.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" variant="gradient">
              <Link href="/register">
                Open a free account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">
                See how it works
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-muted-foreground mt-8 flex items-center gap-2 text-xs"
          >
            <ShieldCheck className="text-success size-4" />
            FDIC-style insured demo balances &middot; No hidden fees &middot; Cancel anytime
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="glass relative rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Total balance</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  <AnimatedCounter value={48231.5} prefix="$" decimals={2} />
                </p>
              </div>
              <span className="bg-success/15 text-success rounded-full px-2.5 py-1 text-xs font-medium">
                +12.4%
              </span>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-80">Nexora Platinum</span>
                <span className="text-xs font-semibold">VISA</span>
              </div>
              <p className="mt-6 font-mono text-lg tracking-widest">
                •••• •••• •••• 4821
              </p>
              <div className="mt-4 flex items-center justify-between text-xs opacity-80">
                <span>J. RIVERA</span>
                <span>12/29</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { name: "Salary deposit", amount: "+$3,200.00", positive: true },
                { name: "Spotify Premium", amount: "-$10.99", positive: false },
                { name: "Transfer to Alex", amount: "-$250.00", positive: false },
              ].map((tx) => (
                <div key={tx.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tx.name}</span>
                  <span className={tx.positive ? "text-success font-medium" : "font-medium"}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="glass absolute -right-6 -bottom-6 hidden rounded-2xl p-4 shadow-xl sm:block"
          >
            <p className="text-muted-foreground text-[10px]">Savings goal</p>
            <p className="text-sm font-semibold">New MacBook — 72%</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
