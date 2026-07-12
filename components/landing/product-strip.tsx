import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const products = [
  {
    id: "savings",
    eyebrow: "Savings",
    title: "Watch your goals grow, automatically",
    description:
      "Create flexible or target savings plans, or lock in a fixed deposit for higher returns — all with real-time progress tracking.",
    bullets: ["Up to 7.2% annual interest", "Auto-save on your schedule", "Break-free flexible plans"],
    preview: (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium">New MacBook Pro</span>
            <span className="text-muted-foreground">$2,160 / $3,000</span>
          </div>
          <Progress value={72} className="mt-2" />
        </div>
        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium">Emergency fund</span>
            <span className="text-muted-foreground">$8,400 / $10,000</span>
          </div>
          <Progress value={84} className="mt-2" />
        </div>
        <div>
          <div className="flex justify-between text-xs">
            <span className="font-medium">Japan trip</span>
            <span className="text-muted-foreground">$1,050 / $5,000</span>
          </div>
          <Progress value={21} className="mt-2" />
        </div>
      </div>
    ),
  },
  {
    id: "loans",
    eyebrow: "Loans",
    title: "Borrow smart, with full transparency",
    description:
      "Apply in minutes, see your exact repayment schedule up front, and track outstanding balances without surprises.",
    bullets: ["Instant eligibility check", "Flexible 3–36 month terms", "No prepayment penalties"],
    preview: (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Loan amount</span>
          <span className="font-medium">$12,000</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Term</span>
          <span className="font-medium">24 months</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Monthly repayment</span>
          <span className="font-medium">$564.20</span>
        </div>
        <div className="border-border/60 flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground">Status</span>
          <span className="bg-success/15 text-success rounded-full px-2 py-0.5 text-xs">Approved</span>
        </div>
      </div>
    ),
  },
  {
    id: "investments",
    eyebrow: "Investments",
    title: "Grow your wealth with confidence",
    description:
      "Invest in mutual funds, stocks and demo crypto assets, and track profit and loss with beautiful, real-time charts.",
    bullets: ["Fractional stock investing", "Diversified mutual funds", "Demo crypto sandbox"],
    preview: (
      <div className="space-y-3 text-sm">
        {[
          { name: "S&P 500 Index Fund", change: "+4.8%", positive: true },
          { name: "NXR Technology Corp.", change: "+2.1%", positive: true },
          { name: "Bitcoin (demo)", change: "-1.4%", positive: false },
        ].map((row) => (
          <div key={row.name} className="flex items-center justify-between">
            <span>{row.name}</span>
            <span className={row.positive ? "text-success font-medium" : "text-destructive font-medium"}>
              {row.change}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

export function ProductStrip() {
  return (
    <>
      {products.map((product, i) => (
        <section key={product.id} id={product.id} className="px-6 py-24">
          <div
            className={`mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2 ${
              i % 2 === 1 ? "[&>*:first-child]:lg:order-2" : ""
            }`}
          >
            <div>
              <SectionHeading
                eyebrow={product.eyebrow}
                title={product.title}
                description={product.description}
                align="left"
                className="mx-0"
              />
              <ul className="mt-6 space-y-2.5">
                {product.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="text-success size-4" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <Button asChild variant="gradient" className="mt-8">
                <Link href="/register">Get started</Link>
              </Button>
            </div>

            <Reveal delay={0.15}>
              <div className="glass rounded-3xl p-6 shadow-xl">{product.preview}</div>
            </Reveal>
          </div>
        </section>
      ))}
    </>
  );
}
