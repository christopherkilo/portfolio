import Link from "next/link";
import { ArrowLeft, House } from "lucide-react";
import { cn } from "@/lib/utils";

type DemoShellProps = {
  projectTitle: string;
  caseStudyHref: string;
  caseStudyLabel?: string;
  notice?: string;
  showHomeLink?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Shared chrome for internal live demos: return to case study,
 * optional demo-data notice, and optional portfolio home link.
 */
export function DemoShell({
  projectTitle,
  caseStudyHref,
  caseStudyLabel,
  notice = "Interactive frontend demo with fictional sample data.",
  showHomeLink = true,
  className,
  children,
}: DemoShellProps) {
  const returnLabel =
    caseStudyLabel ?? `Back to ${projectTitle} Case Study`;

  return (
    <div className={cn("flex min-h-full flex-col", className)}>
      <div className="sticky top-0 z-[70] border-b border-white/10 bg-black/80 text-[13px] text-zinc-200 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link
              href={caseStudyHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/35 bg-amber-300/10 px-2.5 py-1.5 font-medium text-amber-200 transition hover:border-amber-300/55 hover:bg-amber-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label={returnLabel}
            >
              <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{returnLabel}</span>
            </Link>
            {notice ? (
              <p className="hidden text-zinc-400 sm:block" role="note">
                {notice}
              </p>
            ) : null}
          </div>
          {showHomeLink ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <House className="size-3.5" aria-hidden />
              Portfolio home
            </Link>
          ) : null}
        </div>
        {notice ? (
          <p className="border-t border-white/5 px-3 py-1.5 text-zinc-500 sm:hidden" role="note">
            {notice}
          </p>
        ) : null}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
