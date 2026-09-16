import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Code2, Cpu, Palette } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/lib/constants";
import {
  ABOUT_PORTRAIT_SRC,
  aboutAI,
  aboutCapabilities,
  aboutEducationIntro,
  aboutHero,
  aboutLearning,
  aboutLearningClusters,
  aboutPath,
  aboutPhilosophy,
  getAboutCertifications,
  getAboutEducation,
  getPromptEngineeringCaseStudyHref,
} from "@/lib/about";

const capabilityIcons = {
  Code2,
  Palette,
  Cpu,
};

function MiddotList({ items }: { items: readonly string[] }) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-text sm:text-[0.9375rem]">
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 ? (
            <span className="text-muted" aria-hidden>
              {" · "}
            </span>
          ) : null}
          {item}
        </span>
      ))}
    </p>
  );
}

export function AboutPage() {
  const education = getAboutEducation();
  const certifications = getAboutCertifications();
  const promptEngineeringHref = getPromptEngineeringCaseStudyHref();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <section aria-labelledby="about-heading" className="scroll-mt-[var(--scroll-mt)]">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] xl:gap-x-14">
          <SectionHeader
            as="h1"
            id="about-heading"
            eyebrow={aboutHero.eyebrow}
            title={aboutHero.title}
            description={aboutHero.lead}
            className="mb-0 max-w-xl sm:mb-0 lg:col-start-1 lg:row-start-1"
          />

          <figure className="mx-auto w-full max-w-[min(100%,22rem)] lg:col-start-1 lg:row-start-2 lg:mx-0 lg:max-w-none">
            {/*
              Square frame matches the 1:1 asset. Background stays transparent so
              the PNG alpha reveals the page surface — never a white or black fill.
            */}
            <div className="relative aspect-square overflow-hidden bg-transparent">
              <Image
                src={ABOUT_PORTRAIT_SRC}
                alt={`${SITE.name}, software engineer`}
                fill
                sizes="(max-width: 1023px) min(100vw, 22rem), (max-width: 1279px) 22rem, 28rem"
                className="object-contain object-center"
                priority
              />
            </div>
          </figure>

          <div className="flex max-w-prose flex-col justify-start gap-5 lg:col-start-2 lg:row-start-2 lg:max-w-xl lg:pt-1">
            {aboutHero.supporting.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-[1.7] text-secondary md:text-lg"
              >
                {paragraph}
              </p>
            ))}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button href="/contact">Contact Me</Button>
              <Button href="/resume" variant="outline">
                View Resume
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-12 space-y-16 border-t border-white/8 pt-12 sm:mt-16 sm:space-y-20 sm:pt-16 lg:mt-20 lg:space-y-24 lg:pt-20">
        <section
          aria-labelledby="about-path-heading"
          className="scroll-mt-[var(--scroll-mt)]"
        >
          <SectionHeader
            id="about-path-heading"
            eyebrow={aboutPath.eyebrow}
            title={aboutPath.title}
            className="mb-8 max-w-3xl sm:mb-10"
          />
          <div className="max-w-3xl space-y-5 text-base leading-[1.75] text-secondary md:text-lg">
            <p>{aboutPath.opening}</p>
            <p>{aboutPath.foundation}</p>
            <p className="font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              {aboutPath.emphasis}
            </p>
            <p>{aboutPath.progression}</p>
            <p>{aboutPath.independent}</p>
            <p>{aboutPath.method}</p>
          </div>
        </section>

        <section
          aria-labelledby="about-education-heading"
          className="scroll-mt-[var(--scroll-mt)]"
        >
          <SectionHeader
            id="about-education-heading"
            eyebrow={aboutEducationIntro.eyebrow}
            title={aboutEducationIntro.title}
            className="mb-8 max-w-3xl sm:mb-10"
          />

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Education
              </p>
              <ol className="mt-5 space-y-8 border-l border-white/10 pl-5 sm:pl-6">
                {education.map((item) => (
                  <li key={item.school} className="relative">
                    <span
                      className="absolute -left-[1.45rem] top-1.5 size-2 rounded-full bg-primary sm:-left-[1.7rem]"
                      aria-hidden
                    />
                    <h3 className="font-display text-lg font-semibold text-text">
                      {item.school}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-secondary">
                      {item.credential}
                    </p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                      <span className="block">{item.location}</span>
                      <span className="block">{item.dates}</span>
                    </p>
                    <p className="mt-3 max-w-prose text-sm leading-relaxed text-secondary">
                      {item.summary}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Certifications
              </p>
              <ul className="mt-5 divide-y divide-white/8">
                {certifications.map((item) => (
                  <li key={item.name} className="py-4 first:pt-0 last:pb-0">
                    <h3
                      className={
                        item.highlight
                          ? "min-w-0 break-words font-display text-base font-semibold text-primary"
                          : "min-w-0 break-words font-display text-base font-semibold text-text"
                      }
                    >
                      {item.name}
                    </h3>
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-secondary">
                      {item.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="about-learning-heading"
          className="scroll-mt-[var(--scroll-mt)]"
        >
          <SectionHeader
            id="about-learning-heading"
            eyebrow={aboutLearning.eyebrow}
            title={aboutLearning.title}
            description={aboutLearning.intro}
            className="mb-8 max-w-3xl sm:mb-10"
          />
          <dl className="grid gap-8 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-10">
            {aboutLearningClusters.map((cluster) => (
              <div key={cluster.label}>
                <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {cluster.label}
                </dt>
                <dd>
                  <MiddotList items={cluster.items} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="about-ai-heading"
          className="scroll-mt-[var(--scroll-mt)]"
        >
          <header id="about-ai-heading" className="mb-8 max-w-3xl overflow-visible sm:mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {aboutAI.eyebrow}
            </p>
            <h2 className="max-w-3xl text-balance break-words font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-text sm:text-3xl md:text-[2.15rem]">
              {aboutAI.title}
            </h2>
          </header>
          <div className="max-w-3xl space-y-5 text-base leading-[1.75] text-secondary md:text-lg">
            {aboutAI.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {promptEngineeringHref ? (
            <p className="mt-6">
              <Link
                href={promptEngineeringHref}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-text transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {aboutAI.caseStudyLabel}
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </p>
          ) : null}
        </section>

        <section
          aria-labelledby="about-philosophy-heading"
          className="scroll-mt-[var(--scroll-mt)] py-4 sm:py-8"
        >
          <blockquote className="max-w-3xl border-l-2 border-primary pl-5 sm:pl-8">
            <h2
              id="about-philosophy-heading"
              className="font-display text-[1.65rem] font-semibold tracking-tight text-text sm:text-3xl md:text-4xl"
            >
              {aboutPhilosophy.statement}
            </h2>
            <p className="mt-5 max-w-prose text-base leading-[1.75] text-secondary md:text-lg">
              {aboutPhilosophy.supporting}
            </p>
          </blockquote>
        </section>

        <section
          aria-labelledby="about-capabilities-heading"
          className="scroll-mt-[var(--scroll-mt)]"
        >
          <SectionHeader
            id="about-capabilities-heading"
            eyebrow={aboutCapabilities.eyebrow}
            title={aboutCapabilities.title}
            className="mb-8 max-w-3xl sm:mb-10"
          />
          <ul className="grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-10">
            {aboutCapabilities.items.map((role) => {
              const Icon = capabilityIcons[role.icon];
              return (
                <li key={role.id} className="border-t border-white/10 pt-5">
                  <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-secondary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-text">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
                    {role.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
