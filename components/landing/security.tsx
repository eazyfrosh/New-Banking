import { Fingerprint, Lock, ScanEye, ShieldAlert } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";

const points = [
  {
    icon: Lock,
    title: "256-bit encryption",
    description: "Every request is encrypted in transit and at rest.",
  },
  {
    icon: Fingerprint,
    title: "Biometric-ready",
    description: "Face and fingerprint unlock support on supported devices.",
  },
  {
    icon: ScanEye,
    title: "24/7 fraud monitoring",
    description: "Automated systems watch every transaction around the clock.",
  },
  {
    icon: ShieldAlert,
    title: "Instant card freeze",
    description: "Lock a lost or stolen card in one tap, right from your dashboard.",
  },
];

export function Security() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <span className="text-primary text-xs font-semibold tracking-widest uppercase">
            Security
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Your money, protected at every layer
          </h2>
          <p className="text-muted-foreground mt-4 text-lg text-balance">
            Nexora is built on the same security standards used by leading
            financial institutions — so you can bank with confidence.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {points.map((point) => (
              <div key={point.title} className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <point.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{point.title}</p>
                  <p className="text-muted-foreground text-sm">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass-dark relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl">
            <div className="bg-mesh absolute inset-0 opacity-40" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Security score</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
                  Excellent
                </span>
              </div>
              <p className="mt-2 text-5xl font-semibold">98/100</p>

              <div className="mt-8 space-y-4">
                {[
                  { label: "Two-factor authentication", active: true },
                  { label: "Device recognition", active: true },
                  { label: "Transaction PIN", active: true },
                  { label: "Login alerts", active: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{item.label}</span>
                    <span className="bg-success/20 text-success rounded-full px-2 py-0.5 text-xs">
                      Enabled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
