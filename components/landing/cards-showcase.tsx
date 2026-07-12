"use client";

import { motion } from "framer-motion";
import { Lock, Sparkle, Zap } from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/shared/reveal";

const perks = [
  { icon: Zap, text: "Instant virtual cards, no waiting" },
  { icon: Lock, text: "Freeze or replace in one tap" },
  { icon: Sparkle, text: "Custom limits per card" },
];

export function CardsShowcase() {
  return (
    <section id="cards" className="px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <div className="relative h-72">
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -6 }}
              whileInView={{ opacity: 1, y: 0, rotate: -6 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="absolute top-6 left-0 w-72 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 p-5 text-white shadow-xl"
            >
              <div className="flex items-center justify-between text-xs opacity-80">
                <span>Nexora Debit</span>
                <span>MASTERCARD</span>
              </div>
              <p className="mt-8 font-mono tracking-widest">•••• •••• •••• 7734</p>
              <div className="mt-4 flex items-center justify-between text-xs opacity-80">
                <span>A. CHEN</span>
                <span>08/28</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 4 }}
              whileInView={{ opacity: 1, y: 0, rotate: 4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="absolute top-20 left-24 w-72 rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground shadow-2xl"
            >
              <div className="flex items-center justify-between text-xs opacity-80">
                <span>Nexora Platinum</span>
                <span>VISA</span>
              </div>
              <p className="mt-8 font-mono tracking-widest">•••• •••• •••• 4821</p>
              <div className="mt-4 flex items-center justify-between text-xs opacity-80">
                <span>J. RIVERA</span>
                <span>12/29</span>
              </div>
            </motion.div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Cards"
            title="Virtual and physical cards, your way"
            description="Spin up a virtual card in seconds for online purchases, or order a physical card for everyday spending."
            align="left"
            className="mx-0"
          />

          <div className="mt-8 space-y-4">
            {perks.map((perk) => (
              <div key={perk.text} className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <perk.icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{perk.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
