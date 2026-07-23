import type { Metadata } from "next";
import { SITE } from "@/lib/demos/event-horizon/constants";
import { Button } from "@/components/demos/event-horizon/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE.name} — a modern event discovery platform.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        About
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
        Built for discovering what&apos;s next
      </h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
        <p>{SITE.description}</p>
        <p>
          This interactive concept demonstrates searchable event discovery,
          precise filters, browser-saved favorites, and a complete simulated
          reservation experience. The featured events and checkout are
          illustrative; no real tickets or payments are processed.
        </p>
        <p>
          Every interaction is designed to feel immediate and intentional,
          from the responsive catalog to accessible motion and keyboard
          navigation.
        </p>
      </div>
      <div className="mt-8">
        <Button href="/demos/event-horizon/browse">Start browsing</Button>
      </div>
    </div>
  );
}
