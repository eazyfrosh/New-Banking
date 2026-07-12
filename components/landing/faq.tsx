import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/shared/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is Nexora Bank a real bank?",
    answer:
      "Nexora is a demo digital banking platform built to showcase modern fintech UX. All balances and transactions are simulated for demonstration purposes.",
  },
  {
    question: "How long does it take to open an account?",
    answer:
      "Registration takes under two minutes. You'll get a virtual card and starter accounts immediately after signing up.",
  },
  {
    question: "Is my data secure?",
    answer:
      "We use Firebase Authentication and Firestore with strict security rules, encrypted transport, and role-based access control throughout the app.",
  },
  {
    question: "Can I use Nexora on mobile?",
    answer:
      "Yes — the entire experience is fully responsive and optimized for phones, tablets and desktops alike.",
  },
  {
    question: "What currencies are supported?",
    answer:
      "The demo defaults to USD, with exchange rate conversion available from your dashboard for popular currencies.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-secondary/40 px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />

        <Reveal delay={0.1} className="mt-12">
          <Accordion type="single" collapsible className="glass rounded-2xl px-6">
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
