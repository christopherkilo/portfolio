import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InDevBadge } from "@/components/blog/InDevBadge";
import { StarLenzBlogCover } from "@/components/blog/StarLenzBlogCover";
import { ProjectSnapshotCard } from "@/components/projects/ProjectSnapshot";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SITE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import type { ProjectSnapshot } from "@/lib/case-studies/types";

export const metadata: Metadata = pageMetadata({
  title: "StarLenz",
  description:
    "StarLenz is an interactive astronomy experience in active development — currently documented through a development update on the blog.",
  path: "/projects/starlenz",
  ogTitle: `StarLenz · ${SITE.name}`,
});

const STARLENZ_SNAPSHOT: ProjectSnapshot = {
  role: "Frontend Developer / Designer",
  type: "Interactive astronomy experience",
  frontend: "Next.js · TypeScript · Motion design",
  architecture: "Custom constellation presentation with an animated sky.",
  status: "Active development",
};

export default function StarLenzProjectPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <nav className="mb-8">
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-secondary transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Projects
        </Link>
      </nav>

      <article>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--glow-yellow)]" aria-hidden />
            Web application
          </span>
          <InDevBadge />
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl md:text-5xl">
          StarLenz
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-secondary md:text-lg">
          An interactive astronomy experience that started as a graphic design
          concept. The development update on the blog is the current record of
          the work.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {["Next.js", "TypeScript", "UI/UX", "Motion Design"].map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>

        <div className="blog-shot relative mt-8 aspect-[16/9] max-w-3xl overflow-hidden rounded-2xl border border-white/10">
          <StarLenzBlogCover className="absolute inset-0" />
        </div>

        <div className="mt-10 max-w-3xl">
          <ProjectSnapshotCard snapshot={STARLENZ_SNAPSHOT} className="mb-0" />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/blog/building-starlenz">Read the development update</Button>
          <Button href="/blog" variant="outline">
            All articles
          </Button>
        </div>
      </article>
    </div>
  );
}
