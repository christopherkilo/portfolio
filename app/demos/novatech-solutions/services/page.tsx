import type { Metadata } from "next";
import Link from "next/link";
import {
  CTA,
  DEMO_BASE,
  PROCESS_STEPS,
  SERVICE_COMPARISON,
  SERVICES,
} from "@/lib/demos/novatech/constants";
import { contactHref, serviceHref } from "@/lib/demos/novatech/paths";
import { ServiceCards } from "@/components/demos/novatech/home/ServiceCards";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Button } from "@/components/demos/novatech/ui/Button";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Choose the right illustrative NovaTech Solutions capability for your business needs.",
};

const NEED_GUIDES = [
  {
    title: "Systems keep failing or support feels reactive",
    recommendation: "Start with Managed IT, then layer Cybersecurity.",
    hrefs: ["managed-it", "cybersecurity"] as const,
  },
  {
    title: "Connectivity and multi-site growth are the bottleneck",
    recommendation: "Review Networking, with Cloud Solutions when collaboration follows.",
    hrefs: ["networking", "cloud-solutions"] as const,
  },
  {
    title: "Hardware turnover is disrupting daily work",
    recommendation: "Use Computer Repair and a refresh playbook under Managed IT.",
    hrefs: ["computer-repair", "managed-it"] as const,
  },
  {
    title: "Prospects cannot understand what you offer online",
    recommendation: "Begin with Website Development, then connect inquiry flow to consulting CTAs.",
    hrefs: ["website-development"] as const,
  },
] as const;

export default function ServicesPage() {
  return (
    <>
      <section className="gradient-hero border-b border-border">
        <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Services"
            title="Choose the capability that matches the business problem"
            description="Use this overview to decide whether you need ongoing coverage, a focused project, infrastructure work, or a clearer public-facing presence."
            headingLevel="h1"
          />
        </div>
        <ServiceCards
          showHeader={false}
          className="pt-4"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Where to start"
          title="Match the need to a service path"
          description="If you are unsure which card to open, use these common situations as a guide."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {NEED_GUIDES.map((guide, index) => (
            <Reveal key={guide.title} delay={index * 0.04}>
              <article className="h-full rounded-2xl border border-border bg-surface p-6">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {guide.recommendation}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {guide.hrefs.map((id) => {
                    const service = SERVICES.find((item) => item.id === id);
                    if (!service) return null;
                    return (
                      <li key={id}>
                        <Link
                          href={serviceHref(id)}
                          className="inline-flex rounded-full border border-border bg-bg px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {service.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Compare"
            title="How these services differ"
            description="A lightweight comparison for planning conversations—no pricing, guarantees, or contractual claims."
          />
          <div className="space-y-8">
            {SERVICE_COMPARISON.map((group) => (
              <div key={group.id}>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {group.label}
                </h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {group.rows.map((row) => (
                    <article
                      key={row.title}
                      className="rounded-2xl border border-border bg-bg p-5"
                    >
                      <h4 className="font-semibold text-ink">{row.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {row.detail}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {row.serviceIds.map((id) => {
                          const service = SERVICES.find((item) => item.id === id);
                          return service ? (
                            <li key={id}>
                              <Link
                                href={serviceHref(id)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                {service.title}
                              </Link>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Engagement process"
          title="A clear path from discovery to improvement"
          description="Every service conversation still starts with understanding the environment before recommending tools."
        />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((item, index) => (
            <Reveal key={item.step} delay={index * 0.04}>
              <li className="h-full rounded-2xl border border-border bg-surface p-5">
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
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={contactHref()}>{CTA.primary}</Button>
          <Button href={`${DEMO_BASE}/about`} variant="outline">
            {CTA.learnProcess}
          </Button>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
