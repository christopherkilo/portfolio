import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DEMO_BASE } from "@/lib/demos/novatech/constants";
import { cn } from "@/lib/demos/novatech/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const trail = [{ label: "Home", href: DEMO_BASE }, ...items];

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-muted">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast ? "font-medium text-ink" : undefined)}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
