import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  githubControlLabel,
  getPublicSurfaceLinkLabel,
  hasLiveDemo,
  isInternalHref,
  isPortfolioMonorepoGithub,
} from "@/lib/projectData";
import { getWorkIndexGroups, workCategoryBadge, workDetailsLabel } from "@/lib/workIndex";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "All Work",
  description:
    "A compact index of Christopher Kilo’s web, IT, and graphic design work — case studies, demos, and GitHub.",
  path: "/work",
});

export default function WorkIndexPage() {
  const groups = getWorkIndexGroups();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeader
        as="h1"
        eyebrow="Index"
        title="All work"
        description="Web, IT, and graphic design — case studies, demos, and source."
      />

      {groups.map((group) => (
        <section key={group.category} className="mb-12 last:mb-0 sm:mb-16">
          <div className="mb-4 max-w-3xl">
            <h2 className="font-display text-2xl font-semibold text-text">
              {group.title}
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              {workCategoryBadge(group.category)}
            </p>
          </div>

          <ul className="divide-y divide-white/8 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl">
            {group.items.map((item) => (
              <li key={item.id} className="px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                  <div className="min-w-0 max-w-3xl">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        href={item.href}
                        className="font-display text-lg font-semibold text-text transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {item.title}
                      </Link>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-secondary">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {item.technologies.join(" · ")}
                    </p>
                  </div>

                  <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:shrink-0">
                    <li>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-11 items-center text-sm text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {workDetailsLabel(item)}
                      </Link>
                    </li>
                    {hasLiveDemo(item.liveDemo) && item.liveDemo !== item.href ? (
                      <li>
                        <Link
                          href={item.liveDemo}
                          {...(isInternalHref(item.liveDemo)
                            ? {}
                            : { target: "_blank", rel: "noopener noreferrer" })}
                          className="inline-flex min-h-11 items-center text-sm text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {getPublicSurfaceLinkLabel(item.id)}
                        </Link>
                      </li>
                    ) : null}
                    {item.github ? (
                      <li>
                        <a
                          href={item.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center text-sm text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={githubControlLabel({
                            title: item.title,
                            github: item.github,
                          })}
                        >
                          GitHub
                          {isPortfolioMonorepoGithub(item.github) ? (
                            <span className="ml-1 text-xs text-muted">
                              monorepo
                            </span>
                          ) : null}
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
