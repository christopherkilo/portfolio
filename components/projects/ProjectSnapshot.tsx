import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import type { ProjectSnapshot } from "@/lib/case-studies/types";
import {
  githubControlLabel,
  getPublicSurfaceLinkLabel,
  hasLiveDemo,
  isInternalHref,
  isPortfolioMonorepoGithub,
  type Project,
} from "@/lib/projectData";
import { cn } from "@/lib/utils";

type SnapshotRow = {
  label: string;
  value?: string;
};

function snapshotRows(snapshot: ProjectSnapshot): SnapshotRow[] {
  return [
    { label: "Role", value: snapshot.role },
    { label: "Project type", value: snapshot.type },
    { label: "Frontend", value: snapshot.frontend },
    { label: "Backend", value: snapshot.backend },
    { label: "Cloud", value: snapshot.cloud },
    { label: "Testing", value: snapshot.testing },
    { label: "Architecture", value: snapshot.architecture },
    { label: "Status", value: snapshot.status },
  ].filter((row): row is SnapshotRow & { value: string } => Boolean(row.value?.trim()));
}

type ProjectSnapshotCardProps = {
  snapshot: ProjectSnapshot;
  project?: Pick<Project, "id" | "title" | "liveDemo" | "github" | "githubNote">;
  className?: string;
};

export function ProjectSnapshotCard({
  snapshot,
  project,
  className,
}: ProjectSnapshotCardProps) {
  const rows = snapshotRows(snapshot);
  const live = hasLiveDemo(project?.liveDemo) ? project!.liveDemo : undefined;
  const github = project?.github;

  if (!rows.length && !live && !github) return null;

  return (
    <section
      className={cn(
        "mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl",
        className,
      )}
      aria-labelledby="project-snapshot-heading"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] label-accent">
        Project snapshot
      </p>
      <h2
        id="project-snapshot-heading"
        className="mt-2 font-display text-xl font-semibold text-text"
      >
        At a glance
      </h2>

      {rows.length ? (
        <dl className="mt-6 divide-y divide-white/8 border-y border-white/8">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid gap-1 py-3 sm:grid-cols-[8.75rem_minmax(0,1fr)] sm:gap-6 sm:py-3.5"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {row.label}
              </dt>
              <dd className="min-w-0 text-sm leading-relaxed text-text">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {live || github ? (
        <div className="mt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Links
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {live ? (
              <li>
                <Link
                  href={live}
                  {...(isInternalHref(live)
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {!isInternalHref(live) ? (
                    <ExternalLink className="size-3.5" aria-hidden />
                  ) : null}
                  {project
                    ? getPublicSurfaceLinkLabel(project.id)
                    : "Live Demo"}
                </Link>
              </li>
            ) : null}
            {github && project ? (
              <li>
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={githubControlLabel(project)}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <GithubIcon className="size-3.5" />
                  GitHub
                  {isPortfolioMonorepoGithub(github) ? (
                    <span className="text-xs text-muted">portfolio monorepo</span>
                  ) : null}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
