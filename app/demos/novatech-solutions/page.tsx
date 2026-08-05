import type { Metadata } from "next";
import { Hero } from "@/components/demos/novatech/home/Hero";
import { TrustSignals } from "@/components/demos/novatech/home/TrustSignals";
import { ServiceCards } from "@/components/demos/novatech/home/ServiceCards";
import { BusinessInsights } from "@/components/demos/novatech/home/BusinessInsights";
import { Testimonials } from "@/components/demos/novatech/home/Testimonials";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";
import { Accordion } from "@/components/demos/novatech/ui/Accordion";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Button } from "@/components/demos/novatech/ui/Button";
import {
  ABOUT_STATS,
  CTA,
  DEMO_BASE,
  FAQ_ITEMS,
  PROCESS_STEPS,
  SITE,
} from "@/lib/demos/novatech/constants";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";

export const metadata: Metadata = {
  title: "Home",
  description: SITE.description,
};

export default function NovaTechDemoHome() {
  return (
    <>
      <Hero />
      <TrustSignals />
      <BusinessInsights />
      <ServiceCards
        title="Services shaped around business continuity"
        description="Open a service to see the problems it addresses, what an engagement looks like, and what outcomes it is designed to support."
        className="py-20 sm:py-24"
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeader
          eyebrow="Who it’s for"
          title="Built for teams that need IT to stay out of the way"
          description="NovaTech is framed for growing organizations without a full-time IT bench—where downtime, unclear ownership, and reactive vendor support slow the business."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.04}>
              <div className="nt-card h-full p-6 transition hover:-translate-y-0.5">
                <p className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <SectionHeader
            eyebrow="Process"
            title="A clear path from discovery to operations"
            description="Trust comes from a repeatable sequence: understand the environment, stabilize risk, operate predictably, then improve on purpose."
          />
          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.05}>
                <li className="nt-card h-full list-none p-6 transition hover:-translate-y-0.5">
                  <p className="font-mono text-xs font-semibold text-accent">
                    {item.step}
                  </p>
                  <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {item.detail}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
          <div className="mt-12">
            <Button href={`${DEMO_BASE}/about`} variant="outline">
              {CTA.learnProcess}
            </Button>
          </div>
        </div>
      </section>

      <Testimonials />
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Common questions"
          description="Quick answers about Managed IT, Cybersecurity, and how engagement typically works in this demo."
        />
        <Accordion items={FAQ_ITEMS.slice(0, 4)} />
        <div className="mt-12 flex flex-wrap gap-3">
          <Button href={`${DEMO_BASE}/faq`} variant="outline">
            View all FAQs
          </Button>
          <Button href={`${DEMO_BASE}/portfolio`} variant="ghost">
            {CTA.viewWork}
          </Button>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
