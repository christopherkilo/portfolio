"use client";

import { Button } from "@/components/demos/novatech/ui/Button";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";

export function CtaBand() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl gradient-band px-8 py-10 text-band-ink md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              Ready for technology that supports the business—not the other way around?
            </h2>
            <p className="mt-3 text-sm text-band-ink/80 md:text-base">
              Explore a frontend-only inquiry flow for a fictional discovery conversation with NovaTech.
            </p>
          </div>
          <Button href="/demos/novatech-solutions/contact" variant="outline" className="border-band-ink/30 bg-band-action text-band-action-ink hover:bg-band-action/90">
            Try demo inquiry
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
