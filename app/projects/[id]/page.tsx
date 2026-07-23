import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { CaseStudyChartView } from "@/components/projects/CaseStudyChart";
import {
  getAllCaseStudyIds,
  getCaseStudy,
} from "@/lib/caseStudies";
import { categoryLabels, hasLiveDemo, isInternalHref } from "@/lib/projectData";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllCaseStudyIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const study = getCaseStudy(id);
  if (!study) return { title: "Case study" };
  return {
    title: `${study.project.title} — Case Study`,
    description: study.overview,
  };
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { id } = await params;
  const study = getCaseStudy(id);
  if (!study) notFound();

  const { project } = study;

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Projects
        </Link>
        <Link
          href="/"
          className="text-sm text-muted transition hover:text-text"
        >
          Home
        </Link>
      </nav>

      <header className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Case study · {categoryLabels[project.category]}
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-text md:text-5xl">
          {project.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted md:text-lg">
          {study.overview}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {hasLiveDemo(project.liveDemo) ? (
            <Button
              href={project.liveDemo}
              external={!isInternalHref(project.liveDemo)}
              size="lg"
            >
              {isInternalHref(project.liveDemo) ? null : (
                <ExternalLink className="size-4" aria-hidden />
              )}
              Open Live Demo
            </Button>
          ) : null}
          {project.github ? (
            <Button href={project.github} external variant="outline" size="lg">
              <GithubIcon className="size-4" />
              GitHub
            </Button>
          ) : null}
          <Button href="/projects" variant="ghost" size="lg">
            <ArrowLeft className="size-4" aria-hidden />
            All Projects
          </Button>
        </div>
      </header>

      <div className="relative mb-12 aspect-[21/9] overflow-hidden rounded-[1.5rem] border border-white/8 bg-surface-elevated">
        <Image
          src={project.image}
          alt={`${project.title} visual`}
          fill
          priority
          unoptimized
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1100px"
        />
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {study.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              {m.label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-primary">
              {m.value}
            </p>
            <p className="mt-2 text-sm text-muted">{m.detail}</p>
          </div>
        ))}
      </div>

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">Problem</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            {study.problem}
          </p>
        </section>
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">Approach</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            {study.approach}
          </p>
        </section>
      </div>

      <section className="mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
        <h2 className="font-display text-xl font-semibold text-text">Outcome</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
          {study.outcome}
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {study.highlights.map((h) => (
            <li
              key={h}
              className="flex items-start gap-2 text-sm text-secondary"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {h}
            </li>
          ))}
        </ul>
      </section>

      {study.decisions?.length ? (
        <section className="mb-12">
          <div className="mb-6 max-w-2xl">
            <h2 className="font-display text-2xl font-semibold text-text">
              Key decisions and why
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The reasoning, scope choices, and tradeoffs behind the implementation.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {study.decisions.map((decision) => (
              <section
                key={decision.title}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <h3 className="font-display text-lg font-semibold text-text">
                  {decision.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {decision.explanation}
                </p>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-12 space-y-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text">
            Results & analysis
          </h2>
          <p className="mt-2 text-sm text-muted">
            High-resolution vector charts — crisp at any display density.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-1">
          {study.charts.map((chart) => (
            <CaseStudyChartView key={chart.id} chart={chart} />
          ))}
        </div>
      </section>

      {study.nextSteps?.length ? (
        <section className="mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">
            What I would build next
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            These are the deliberate gaps between the current frontend prototype
            and a production event marketplace.
          </p>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {study.nextSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 text-sm leading-relaxed text-secondary"
              >
                <span className="font-mono text-xs text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <footer className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-text">
            {hasLiveDemo(project.liveDemo)
              ? "Explore the live build"
              : "Continue exploring"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {hasLiveDemo(project.liveDemo)
              ? "Open the demo, then return here anytime via the demo chrome or browser Back."
              : "Return to the projects index or open the repository when available."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {hasLiveDemo(project.liveDemo) ? (
            <Button
              href={project.liveDemo}
              external={!isInternalHref(project.liveDemo)}
            >
              {isInternalHref(project.liveDemo) ? null : (
                <ExternalLink className="size-4" aria-hidden />
              )}
              Open Live Demo
            </Button>
          ) : null}
          {project.github && !hasLiveDemo(project.liveDemo) ? (
            <Button href={project.github} external>
              <GithubIcon className="size-4" />
              GitHub
            </Button>
          ) : null}
          <Button href="/projects" variant="outline">
            Back to Projects
          </Button>
        </div>
      </footer>
    </article>
  );
}
