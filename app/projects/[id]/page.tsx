import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GithubIcon } from "@/components/ui/BrandIcons";
import {
  ArchitectureHighlightCard,
  ArchitectureLanes,
  PipelineSteps,
} from "@/components/projects/ArchitectureDiagram";
import { CaseStudyChartView } from "@/components/projects/CaseStudyChart";
import { CaseStudyHeroCover } from "@/components/projects/CaseStudyHeroCover";
import { ProjectSnapshotCard } from "@/components/projects/ProjectSnapshot";
import { BuiltNotMocked } from "@/components/projects/BuiltNotMocked";
import {
  getAllCaseStudyIds,
  getCaseStudy,
} from "@/lib/caseStudies";
import {
  categoryBadgeLabels,
  githubControlLabel,
  hasLiveDemo,
  isInternalHref,
  isPortfolioMonorepoGithub,
  getPublicSurfaceCta,
  getPublicSurfaceLinkLabel,
} from "@/lib/projectData";
import { pageMetadata } from "@/lib/seo";

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
  return pageMetadata({
    title: `${study.project.title} — Case Study`,
    description: study.overview,
    path: `/projects/${id}`,
  });
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
          className="inline-flex min-h-11 items-center gap-2 text-sm text-secondary transition hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Projects
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm text-secondary transition hover:text-text"
        >
          Home
        </Link>
      </nav>

      <header className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Case study · {categoryBadgeLabels[project.category]}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl md:text-5xl">
          {project.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-secondary md:text-lg">
          {study.overview}
        </p>

        {study.techGroups?.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {study.techGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((tech) => (
                    <Badge key={tech}>{tech}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech}>{tech}</Badge>
            ))}
          </div>
        )}

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
              {getPublicSurfaceLinkLabel(project.id)}
            </Button>
          ) : null}
          {project.github ? (
            <Button
              href={project.github}
              external
              variant="outline"
              size="lg"
              aria-label={githubControlLabel(project)}
            >
              <GithubIcon className="size-4" />
              GitHub
              {isPortfolioMonorepoGithub(project.github) ? (
                <span className="text-xs font-normal text-muted">
                  portfolio monorepo
                </span>
              ) : null}
            </Button>
          ) : null}
          {project.id === "event-horizon" ? (
            <Button href="/projects/event-horizon-brand" variant="outline" size="lg">
              View the brand identity
            </Button>
          ) : null}
          <Button href="/projects" variant="ghost" size="lg">
            <ArrowLeft className="size-4" aria-hidden />
            Back to Projects
          </Button>
        </div>
      </header>

      {study.snapshot ? (
        <ProjectSnapshotCard snapshot={study.snapshot} project={project} />
      ) : null}

      <CaseStudyHeroCover
        projectId={project.id}
        title={project.title}
        image={project.image}
      />

      {study.metrics.length ? (
        <div
          className={
            study.metrics.length === 1
              ? "mb-12 grid gap-4 md:max-w-sm"
              : "mb-12 grid gap-4 md:grid-cols-3"
          }
        >
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
              <p className="mt-2 text-sm text-secondary">{m.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">Problem</h2>
          <p className="mt-3 text-sm leading-relaxed text-secondary md:text-base">
            {study.problem}
          </p>
        </section>
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">Approach</h2>
          <p className="mt-3 text-sm leading-relaxed text-secondary md:text-base">
            {study.approach}
          </p>
        </section>
      </div>

      {study.howItWorks || study.architecture?.length ? (
        <section className="mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">How it works</h2>
          {study.howItWorks ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
              {study.howItWorks}
            </p>
          ) : null}
          {study.architecture?.length ? (
            <PipelineSteps steps={study.architecture} className="mt-6" />
          ) : null}
        </section>
      ) : null}

      {study.architectureHighlight ? (
        <ArchitectureHighlightCard highlight={study.architectureHighlight} />
      ) : null}

      {study.architectureLanes?.length ? (
        <ArchitectureLanes
          title={study.architectureLanesTitle ?? "Architecture"}
          description={study.architectureLanesDescription}
          entry={study.architectureEntry}
          lanes={study.architectureLanes}
        />
      ) : null}

      {study.decisions?.length ? (
        <section className="mb-12">
          <h2 className="mb-6 font-display text-2xl font-semibold text-text">
            {study.decisionsHeading ?? "Engineering decisions"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {study.decisions.map((decision) => (
              <section
                key={decision.title}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <h3 className="font-display text-lg font-semibold text-text">
                  {decision.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  {decision.explanation}
                </p>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      {study.verification ? (
        <BuiltNotMocked verification={study.verification} />
      ) : null}

      <section className="mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
        <h2 className="font-display text-xl font-semibold text-text">
          Current state
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
          {study.outcome}
        </p>
        {study.currentState ? (
          <div
            className={
              study.currentState.demo?.length
                ? "mt-8 grid gap-6 md:grid-cols-2"
                : "mt-8"
            }
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] label-accent">
                Implemented
              </p>
              <ul className="mt-3 space-y-2">
                {study.currentState.implemented.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-secondary">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </div>
            {study.currentState.demo?.length ? (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Demo / seeded
                </p>
                <ul className="mt-3 space-y-2">
                  {study.currentState.demo.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-secondary">
                      △ {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {study.learned ? (
        <section className="mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">
            What I learned
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
            {study.learned}
          </p>
        </section>
      ) : null}

      {study.charts.length ? (
        <section className="mb-12 space-y-6">
          <h2 className="font-display text-2xl font-semibold text-text">
            Results
          </h2>
          <div className="grid gap-6 lg:grid-cols-1">
            {study.charts.map((chart) => (
              <CaseStudyChartView key={chart.id} chart={chart} />
            ))}
          </div>
        </section>
      ) : null}

      {study.nextSteps?.length ? (
        <section className="mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
          <h2 className="font-display text-xl font-semibold text-text">
            Next
          </h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {study.nextSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 text-sm leading-relaxed text-secondary"
              >
                <span className="font-mono text-xs label-accent">
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
              ? getPublicSurfaceCta(project.id).title
              : "Continue exploring"}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {hasLiveDemo(project.liveDemo)
              ? getPublicSurfaceCta(project.id).body
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
              {getPublicSurfaceLinkLabel(project.id)}
            </Button>
          ) : null}
          {project.github && !hasLiveDemo(project.liveDemo) ? (
            <Button
              href={project.github}
              external
              aria-label={githubControlLabel(project)}
            >
              <GithubIcon className="size-4" />
              GitHub
              {isPortfolioMonorepoGithub(project.github) ? (
                <span className="text-xs font-normal text-muted">
                  portfolio monorepo
                </span>
              ) : null}
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
