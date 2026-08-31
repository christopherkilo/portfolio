import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl md:text-5xl">
        Page not found.
      </h1>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-secondary md:text-lg">
        That URL isn&apos;t part of this site. Head home or browse the work.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/">Back Home</Button>
        <Button href="/projects" variant="outline">
          View Projects
        </Button>
      </div>
    </div>
  );
}
