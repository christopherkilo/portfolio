import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Cloud,
  Code2,
  Network,
  Server,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  CTA,
  DEMO_BASE,
  SITE,
  type Service,
} from "@/lib/demos/novatech/constants";
import {
  contactHref,
  getRelatedServices,
  getServiceById,
  getServiceIds,
  serviceHref,
} from "@/lib/demos/novatech/paths";
import { Breadcrumbs } from "@/components/demos/novatech/layout/Breadcrumbs";
import { Button } from "@/components/demos/novatech/ui/Button";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";

const icons: Record<string, LucideIcon> = {
  Server,
  Wrench,
  Network,
  ShieldCheck,
  Code2,
  Cloud,
};

type PageProps = {
  params: Promise<{ serviceId: string }>;
};

export function generateStaticParams() {
  return getServiceIds().map((serviceId) => ({ serviceId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { serviceId } = await params;
  const service = getServiceById(serviceId);
  if (!service) {
    return {
      title: "Service not found",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: service.title,
    description: `${service.valueProposition} Illustrative ${SITE.name} service page.`,
    robots: { index: false, follow: false },
  };
}

function ServiceDetail({ service }: { service: Service }) {
  const Icon = icons[service.icon];
  const related = getRelatedServices(service);

  return (
    <>
      <section className="gradient-hero border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: "Services", href: `${DEMO_BASE}/services` },
              { label: service.title },
            ]}
          />
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-5" aria-hidden />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Service overview
              </p>
              <h1 className="mt-3 font-display max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {service.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                {service.valueProposition}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {service.suitableFor}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={contactHref(service.id)}>
                  {CTA.primary}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
                <Button href={`${DEMO_BASE}/services`} variant="outline">
                  {CTA.exploreServices}
                </Button>
              </div>
            </div>
            <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">
                Engagement snapshot
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Style</dt>
                  <dd className="mt-1 font-medium capitalize text-ink">
                    {service.engagement.replace("-", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Focus</dt>
                  <dd className="mt-1 font-medium capitalize text-ink">
                    {service.focus}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Domain</dt>
                  <dd className="mt-1 font-medium capitalize text-ink">
                    {service.domain.replace("-", " ")}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-xl font-semibold text-ink">
                Common business problems
              </h2>
              <ul className="mt-4 space-y-3">
                {service.problems.map((problem) => (
                  <li
                    key={problem}
                    className="rounded-xl bg-bg px-4 py-3 text-sm leading-relaxed text-muted"
                  >
                    {problem}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="h-full rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-xl font-semibold text-ink">
                Representative capabilities
              </h2>
              <ul className="mt-4 space-y-3">
                {service.capabilities.map((capability) => (
                  <li
                    key={capability}
                    className="flex gap-2 text-sm leading-relaxed text-muted"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {capability}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Example engagement process
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            An illustrative sequence for planning conversations—not a contractual delivery promise.
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {service.process.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-border bg-bg p-5"
              >
                <p className="font-mono text-xs text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Intended outcomes
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {service.outcomes.map((outcome) => (
            <li
              key={outcome}
              className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-muted"
            >
              {outcome}
            </li>
          ))}
        </ul>

        {related.length ? (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold text-ink">
              Related services
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={serviceHref(item.id)}
                    className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="font-display font-semibold text-ink">
                      {item.title}
                    </span>
                    <span className="mt-2 text-sm text-muted">
                      {item.description}
                    </span>
                    <span className="mt-4 text-sm font-semibold text-primary">
                      {CTA.learnMore}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <CtaBand
        serviceId={service.id}
        title={`Discuss ${service.title.toLowerCase()} for your team`}
        description="Open the consultation form with this service already selected. The form validates locally and does not send data."
      />
    </>
  );
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { serviceId } = await params;
  const service = getServiceById(serviceId);
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}
