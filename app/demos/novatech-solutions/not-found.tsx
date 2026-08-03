import type { Metadata } from "next";
import Link from "next/link";
import { CTA, DEMO_BASE, SITE } from "@/lib/demos/novatech/constants";
import { Button } from "@/components/demos/novatech/ui/Button";
import { contactHref } from "@/lib/demos/novatech/paths";

export const metadata: Metadata = {
  title: "Page not found",
  description: `That page is not part of the fictional ${SITE.name} demo.`,
  robots: { index: false, follow: false },
};

export default function NovaTechNotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-4 py-20 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {SITE.name}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        That service or page is not part of this fictional MSP demo. Choose a
        published service or return to the overview.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href={DEMO_BASE}>Return home</Button>
        <Button href={`${DEMO_BASE}/services`} variant="outline">
          {CTA.exploreServices}
        </Button>
        <Button href={`${DEMO_BASE}/portfolio`} variant="ghost">
          {CTA.viewWork}
        </Button>
        <Button href={contactHref()} variant="ghost">
          {CTA.contact}
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted">
        Looking for a specific offering? Start from{" "}
        <Link
          href={`${DEMO_BASE}/services`}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Services
        </Link>
        .
      </p>
    </section>
  );
}
