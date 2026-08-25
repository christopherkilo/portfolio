import type { Metadata } from "next";
import {
  ABOUT_STATS,
  CTA,
  DEMO_BASE,
  OPERATING_PRINCIPLES,
  SITE,
} from "@/lib/demos/novatech/constants";
import { contactHref } from "@/lib/demos/novatech/paths";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";
import { Button } from "@/components/demos/novatech/ui/Button";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";

export const metadata: Metadata = {
  title: "About",
  description: `How the fictional ${SITE.name} team approaches discovery, communication, documentation, and phased recommendations.`,
  robots: { index: false, follow: false },
};

export default function AboutPage() {
  return (
    <>
      <section className="gradient-hero border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeader
            eyebrow="About"
            title="Operating principles for dependable technology support"
            description="This fictional company profile explains how NovaTech would earn trust: discovery before recommendations, clear communication, reusable documentation, and phased change."
            headingLevel="h1"
          />
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <div className="space-y-4 text-base leading-relaxed text-muted">
                <p>
                  NovaTech is presented as an extension of a client’s operations
                  team—not a black-box vendor. The goal is fewer surprises,
                  clearer ownership, and technology decisions that leadership can
                  follow.
                </p>
                <p>
                  Specialists cover infrastructure, Cybersecurity, Cloud Solutions, and
                  Website Development. Recommendations stay grounded in business
                  constraints: staffing, downtime tolerance, and what teams will
                  actually maintain.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button href={contactHref()}>{CTA.primary}</Button>
                  <Button href={`${DEMO_BASE}/services`} variant="outline">
                    {CTA.exploreServices}
                  </Button>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="grid grid-cols-2 gap-4">
                {ABOUT_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                  >
                    <p className="font-display text-2xl font-bold text-primary sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How we work"
          title="Concrete principles instead of slogans"
          description="These operating habits frame the demo’s discovery-to-delivery story without inventing metrics or guarantees."
        />
        <ol className="grid gap-4 md:grid-cols-2">
          {OPERATING_PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.id} delay={index * 0.04}>
              <li className="h-full rounded-2xl border border-border bg-surface p-6">
                <p className="font-mono text-xs text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold text-ink">
                  {principle.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {principle.detail}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <CtaBand
        title="Talk through an illustrative discovery conversation"
        description="Request a consultation to explore how this fictional MSP would frame priorities for your environment."
      />
    </>
  );
}
