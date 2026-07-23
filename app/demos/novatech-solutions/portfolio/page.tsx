import type { Metadata } from "next";
import { PORTFOLIO_ITEMS, SITE } from "@/lib/demos/novatech/constants";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";

export const metadata: Metadata = {
  title: "Portfolio",
  description: `Illustrative ${SITE.name} case studies.`,
};

export default function PortfolioPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Portfolio"
          title="Illustrative engagement concepts"
          description="Fictional mini case studies created for this portfolio demo."
          headingLevel="h1"
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PORTFOLIO_ITEMS.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.04}>
              <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/35 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {item.category}
                </p>
                <h2 className="mt-3 font-display text-xl font-semibold text-ink">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.summary}
                </p>
                <dl className="mt-5 space-y-4 border-t border-border pt-5">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Challenge
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted">
                      {item.challenge}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Scope
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted">
                      {item.scope}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Intended outcome
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted">
                      {item.outcome}
                    </dd>
                  </div>
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
