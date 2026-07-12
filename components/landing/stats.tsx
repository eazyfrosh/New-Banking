import { Reveal } from "@/components/shared/reveal";
import { AnimatedCounter } from "@/components/shared/animated-counter";

const stats = [
  { value: 2.4, suffix: "M+", label: "Active customers" },
  { value: 48, suffix: "B", label: "Processed annually", prefix: "$" },
  { value: 99.98, suffix: "%", label: "Platform uptime", decimals: 2 },
  { value: 120, suffix: "+", label: "Countries supported" },
];

export function Stats() {
  return (
    <section className="border-border/60 border-y px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08} className="text-center">
            <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals ?? 0}
              />
            </p>
            <p className="text-muted-foreground mt-1 text-sm">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
