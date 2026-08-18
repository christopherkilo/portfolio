import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { SITE } from "@/lib/constants";
import {
  resumeCertifications,
  resumeEducation,
  resumeExperience,
  resumeMeta,
  resumeProjects,
  resumeSkillGroups,
} from "@/lib/resume";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resume",
  description: `${SITE.name} — ${SITE.title}. Skills, selected projects, experience, education, and downloadable resume.`,
  openGraph: {
    title: `Resume · ${SITE.name}`,
    description: `${SITE.title} based in ${resumeMeta.location}. Skills, selected projects, experience, and downloadable PDF.`,
    url: "/resume",
  },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
      {children}
    </p>
  );
}

function SectionHeading({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <h2
      id={id}
      className="mb-5 font-display text-xl font-semibold tracking-tight text-text sm:text-2xl"
    >
      {title}
    </h2>
  );
}

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      {/* Intro */}
      <header className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8 lg:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/[0.07] blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end lg:gap-10">
          <div>
            <Eyebrow>Resume · {SITE.resumeUpdatedLabel}</Eyebrow>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-text min-[380px]:text-4xl sm:text-5xl">
              {resumeMeta.name}
            </h1>
            <p className="mt-2 text-lg font-medium text-secondary">
              {resumeMeta.headline}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-secondary">
              {resumeMeta.summary}
            </p>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary">
              <span className="inline-flex min-h-11 items-center gap-2">
                <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
                {resumeMeta.location}
              </span>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex min-h-11 max-w-full items-center gap-2 transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Mail className="size-4 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 break-all">{SITE.email}</span>
              </a>
              <a
                href={SITE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowUpRight className="size-4 shrink-0 text-muted" aria-hidden />
                www.christopherkilo.com
              </a>
              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <GithubIcon className="size-4 shrink-0 text-muted" />
                GitHub
              </a>
              <a
                href={SITE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <LinkedinIcon className="size-4 shrink-0 text-muted" />
                LinkedIn
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 [&_.inline-flex]:w-full [&_a]:w-full [&_button]:w-full">
            <Button
              href={SITE.resume}
              download={SITE.resumeFileName}
              size="lg"
              aria-label={`Download ${SITE.name} resume PDF`}
            >
              <Download className="size-4" aria-hidden />
              Download Resume
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button href="/projects" variant="outline" size="lg">
                Projects
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                Contact
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-10 space-y-10 sm:mt-12 sm:space-y-12">
        {/* Skills */}
        <section aria-labelledby="skills">
          <SectionHeading id="skills" title="Skills" />
          <div className="grid gap-4 sm:grid-cols-2">
            {resumeSkillGroups.map((group) => (
              <div
                key={group.label}
                className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {group.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {group.skills.map((skill, i) => (
                    <span key={skill}>
                      {i > 0 ? (
                        <span className="text-muted" aria-hidden>
                          {" · "}
                        </span>
                      ) : null}
                      <span
                        className={
                          skill === "CompTIA A+"
                            ? "font-medium text-primary"
                            : "text-text"
                        }
                      >
                        {skill}
                      </span>
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section aria-labelledby="projects">
          <SectionHeading id="projects" title="Selected Projects" />
          <div className="space-y-0 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8">
            {resumeProjects.map((project) => (
              <article
                key={project.id}
                className="group grid gap-3 p-5 transition hover:bg-white/[0.03] sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6 sm:p-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-display text-lg font-semibold text-text">
                      {project.title}
                    </h3>
                    <p className="min-w-0 max-w-full break-words font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      {project.technologies.join(" · ")}
                    </p>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
                    {project.summary}
                  </p>
                </div>
                <Link
                  href={project.href}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-text transition group-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Case Study
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section aria-labelledby="experience">
          <SectionHeading id="experience" title="Experience" />
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6">
            {resumeExperience.map((job) => (
              <article key={`${job.employer}-${job.role}`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-text">
                      {job.role}
                    </h3>
                    <p className="mt-0.5 text-sm text-secondary">{job.employer}</p>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                    {job.dates}
                  </p>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary">
                  {job.summary}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Education + Certs */}
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
          <section aria-labelledby="education">
            <SectionHeading id="education" title="Education" />
            <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              {resumeEducation.map((item, i) => (
                <div
                  key={item.school}
                  className={cn(
                    i > 0 && "border-t border-white/8 pt-4",
                  )}
                >
                  <h3 className="font-display text-base font-semibold text-text">
                    {item.school}
                  </h3>
                  <p className="mt-1 text-sm text-secondary">
                    {item.credential}
                    <span className="text-muted"> · {item.dates}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="certifications">
            <SectionHeading id="certifications" title="Certifications" />
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <p className="text-sm leading-relaxed text-secondary">
                {resumeCertifications.map((cert, i) => (
                  <span key={cert.name}>
                    {i > 0 ? (
                      <span className="text-muted" aria-hidden>
                        {" · "}
                      </span>
                    ) : null}
                    <span
                      className={
                        cert.highlight
                          ? "font-semibold text-primary"
                          : "text-text"
                      }
                    >
                      {cert.name}
                    </span>
                  </span>
                ))}
              </p>
              <p className="mt-4">
                <Badge tone="primary">CompTIA A+</Badge>
              </p>
            </div>
          </section>
        </div>

        {/* Closing CTA */}
        <footer className="flex flex-col gap-5 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="max-w-md">
            <p className="font-display text-lg font-semibold text-text">
              Prefer the PDF?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary">
              Download the formal resume, or jump to projects and contact.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              href={SITE.resume}
              download={SITE.resumeFileName}
              size="lg"
              aria-label={`Download ${SITE.name} resume PDF`}
            >
              <Download className="size-4" aria-hidden />
              Download Resume
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Contact Me
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
