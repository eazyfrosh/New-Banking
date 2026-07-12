import { Star } from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Amara Chen",
    role: "Freelance designer",
    quote:
      "Nexora replaced three different apps for me. Transfers are instant and the savings goals actually keep me motivated.",
  },
  {
    name: "Marcus Webb",
    role: "Small business owner",
    quote:
      "The dashboard makes it so easy to see exactly where my money is. Card freezing saved me during a lost-wallet scare.",
  },
  {
    name: "Priya Nair",
    role: "Graduate student",
    quote:
      "Applying for a small loan took five minutes and I could see the full repayment schedule before accepting. No surprises.",
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Loved by customers"
          title="Don't just take our word for it"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-balance">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-2">
                    <Avatar>
                      <AvatarFallback>
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-muted-foreground text-xs">{t.role}</p>
                    </div>
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
