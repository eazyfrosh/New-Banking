import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="px-6 py-24">
      <Reveal className="mx-auto max-w-4xl">
        <div className="bg-mesh relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Ready to bank better?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 text-balance">
            Join millions of people who trust Novaofficial with their everyday finances.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link href="/register">
              Open your free account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
