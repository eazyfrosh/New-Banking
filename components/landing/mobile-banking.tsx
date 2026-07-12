import { Fingerprint, QrCode, Vibrate } from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/shared/reveal";

const items = [
  {
    icon: Fingerprint,
    title: "Biometric login",
    description: "Unlock your account instantly with Face ID or fingerprint.",
  },
  {
    icon: QrCode,
    title: "QR pay & receive",
    description: "Scan to pay in-store or generate a code to get paid.",
  },
  {
    icon: Vibrate,
    title: "Live push alerts",
    description: "Know the moment money moves — every time, every device.",
  },
];

export function MobileBanking() {
  return (
    <section className="bg-secondary/40 px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Mobile banking"
            title="Your entire bank, right in your pocket"
            description="A fast, native-feeling experience with everything you need — optimized for one-handed use."
            align="left"
            className="mx-0"
          />

          <div className="mt-8 space-y-6">
            {items.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <item.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Reveal delay={0.15} className="mx-auto">
          <div className="glass mx-auto w-64 rounded-[2.5rem] border-8 border-card p-3 shadow-2xl">
            <div className="bg-background rounded-[1.75rem] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium">Good evening, Jordan</span>
                <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                  J
                </span>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-4 text-primary-foreground">
                <p className="text-[10px] opacity-80">Available balance</p>
                <p className="mt-1 text-xl font-semibold">$48,231.50</p>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {["Send", "Pay", "Save", "More"].map((label) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span className="bg-muted flex size-9 items-center justify-center rounded-xl text-xs">
                      •
                    </span>
                    <span className="text-[9px]">{label}</span>
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
