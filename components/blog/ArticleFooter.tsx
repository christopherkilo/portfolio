import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BlogPostMeta } from "@/lib/blog/types";
import type { RelatedProjectLink } from "@/lib/blog/relatedProjects";
import { InDevBadge } from "@/components/blog/InDevBadge";
import { Button } from "@/components/ui/Button";

export function ArticleFooter({
  related,
  previous,
  next,
}: {
  related: RelatedProjectLink | null;
  previous: BlogPostMeta | null;
  next: BlogPostMeta | null;
}) {
  return (
    <footer className="mt-16 border-t border-white/8 pt-10">
      {related ? (
        <div className="glass-panel rounded-2xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Related project
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="font-display text-xl font-semibold text-text">
              {related.label}
            </p>
            {related.inDevelopment ? <InDevBadge /> : null}
          </div>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-secondary">
            {related.inDevelopment
              ? "The case study is still being written. You can open the in-development project page for context."
              : `Open the ${related.label} project page.`}
          </p>
          <div className="mt-4">
            <Button href={related.href} variant="outline" size="sm">
              View {related.label}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/blog"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-secondary transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Blog
        </Link>
      </div>

      {previous || next ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {previous ? (
            <Link
              href={previous.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <p className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-muted">
                <ArrowLeft className="size-3.5" aria-hidden />
                Previous
              </p>
              <p className="mt-2 font-display text-base font-semibold text-text group-hover:text-primary">
                {previous.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={next.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-right transition hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:justify-self-stretch"
            >
              <p className="inline-flex items-center justify-end gap-1 text-xs uppercase tracking-[0.16em] text-muted">
                Next
                <ArrowRight className="size-3.5" aria-hidden />
              </p>
              <p className="mt-2 font-display text-base font-semibold text-text group-hover:text-primary">
                {next.title}
              </p>
            </Link>
          ) : null}
        </div>
      ) : null}
    </footer>
  );
}
