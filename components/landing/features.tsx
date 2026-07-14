import {
  ArrowLeftRight,
  BellRing,
  LineChart,
  PiggyBank,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wallet,
    title: "Unified accounts",
    description: "Current, savings and fixed deposit accounts in one clean view.",
  },
  {
    icon: ArrowLeftRight,
    title: "Instant transfers",
    description: "Send money within Novaofficial, to any bank, or across borders in seconds.",
  },
  {
    icon: PiggyBank,
    title: "Smart savings",
    description: "Automated goals with real-time progress and compounding interest.",
  },
  {
    icon: LineChart,
    title: "Investing made simple",
    description: "Mutual funds, stocks and crypto — track performance in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud protection",
    description: "AI-assisted monitoring flags unusual activity before it becomes a problem.",
  },
  {
    icon: BellRing,
    title: "Real-time alerts",
    description: "Stay informed with instant notifications for every account event.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Platform"
          title="Everything your money needs, in one place"
          description="Novaofficial brings spending, saving, borrowing and investing together — designed to feel effortless."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.08}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="flex flex-col gap-4">
                  <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                    <feature.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
