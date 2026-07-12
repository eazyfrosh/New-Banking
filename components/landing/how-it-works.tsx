import { CreditCard, ShieldCheck, UserPlus, Wallet2 } from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/shared/reveal";

const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    description: "Sign up in minutes with just your email — no paperwork, no branch visits.",
  },
  {
    icon: ShieldCheck,
    title: "Verify your identity",
    description: "Upload your ID and a utility bill to unlock full account features.",
  },
  {
    icon: Wallet2,
    title: "Fund your wallet",
    description: "Transfer from another bank or receive your first deposit instantly.",
  },
  {
    icon: CreditCard,
    title: "Spend, save & grow",
    description: "Get a virtual card immediately and start saving or investing right away.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-secondary/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Getting started"
          title="Up and running in four simple steps"
          description="From sign-up to your first transfer — no lines, no waiting."
        />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1} className="relative">
              <div className="flex flex-col items-start gap-4">
                <span className="bg-card border-border/60 text-primary flex size-12 items-center justify-center rounded-2xl border shadow-sm">
                  <step.icon className="size-5" />
                </span>
                <span className="text-muted-foreground text-xs font-semibold">
                  STEP {i + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
