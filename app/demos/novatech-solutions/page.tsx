import { Hero } from "@/components/demos/novatech/home/Hero";
import { ServiceCards } from "@/components/demos/novatech/home/ServiceCards";
import { Testimonials } from "@/components/demos/novatech/home/Testimonials";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";
import { Accordion } from "@/components/demos/novatech/ui/Accordion";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Button } from "@/components/demos/novatech/ui/Button";
import { ABOUT_STATS, FAQ_ITEMS } from "@/lib/demos/novatech/constants";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Discover",
    detail: "Map systems, priorities, and risk so the engagement starts with clarity.",
  },
  {
    step: "02",
    title: "Stabilize",
    detail: "Close urgent gaps in backup, patching, and access before expanding scope.",
  },
  {
    step: "03",
    title: "Operate",
    detail: "Run monitoring, help desk, and reporting on a predictable monthly cadence.",
  },
  {
    step: "04",
    title: "Improve",
    detail: "Iterate on security, cloud, and productivity with documented roadmap reviews.",
  },
] as const;

export default function NovaTechDemoHome() {
  return (
    <>
      <Hero />
      <ServiceCards />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why teams choose us"
          title="Trust indicators for modern IT"
          description="Illustrative operating principles that frame how a managed partner earns confidence."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.04}>
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <p className="font-display text-2xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Process"
            title="A clear path from audit to operations"
            description="A four-stage engagement model designed for this fictional MSP demo."
          />
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.05}>
                <li className="h-full rounded-2xl border border-border bg-bg p-5">
                  <p className="font-mono text-xs text-accent">{item.step}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.detail}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <Testimonials />
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Common questions"
          description="Quick answers about managed IT, security, and how engagement typically works."
        />
        <Accordion items={FAQ_ITEMS.slice(0, 4)} />
        <div className="mt-8">
          <Button href="/demos/novatech-solutions/faq" variant="outline">
            View all FAQs
          </Button>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
