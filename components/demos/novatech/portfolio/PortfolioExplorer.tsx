"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PORTFOLIO_ITEMS } from "@/lib/demos/novatech/constants";
import {
  filterPortfolioByCategory,
  getPortfolioCategories,
  portfolioHref,
  resolvePortfolioCategoryParam,
  serviceHref,
} from "@/lib/demos/novatech/paths";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Button } from "@/components/demos/novatech/ui/Button";
import { cn } from "@/lib/demos/novatech/utils";
import Link from "next/link";

function PortfolioExplorerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const categories = getPortfolioCategories();
  const requestedCategory = searchParams.get("category");
  const { category: validCategory, shouldCanonicalize } =
    resolvePortfolioCategoryParam(requestedCategory, categories);
  const items = filterPortfolioByCategory(validCategory);

  useEffect(() => {
    if (!shouldCanonicalize) return;
    router.replace(portfolioHref("all"), { scroll: false });
  }, [shouldCanonicalize, router]);

  function setCategory(category: string) {
    router.replace(portfolioHref(category), { scroll: false });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Portfolio"
        title="Illustrative engagement concepts"
        description="Fictional mini case studies created for this portfolio demo. Filter by service category to see how different problems are framed."
        headingLevel="h1"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          Showing <strong className="text-ink">{items.length}</strong> of{" "}
          {PORTFOLIO_ITEMS.length} illustrative projects
          {validCategory !== "all" ? ` in ${validCategory}` : ""}.
        </p>
        {validCategory !== "all" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategory("all")}
          >
            All projects
          </Button>
        ) : null}
      </div>

      <div
        role="group"
        aria-label="Filter portfolio by category"
        className="mb-8 flex flex-wrap gap-2"
      >
        <button
          type="button"
          onClick={() => setCategory("all")}
          aria-pressed={validCategory === "all"}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            validCategory === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-surface text-muted hover:text-ink",
          )}
        >
          All
        </button>
        {categories.map((category) => {
          const active = validCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setCategory(category)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:text-ink",
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={validCategory}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <article
              key={item.id}
              className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {item.category}
              </p>
              <h2 className="mt-3 font-display text-xl font-semibold text-ink">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.summary}
              </p>
              <dl className="mt-5 space-y-4 border-t border-border pt-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Challenge
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">
                    {item.challenge}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Scope
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">
                    {item.scope}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Intended outcome
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">
                    {item.outcome}
                  </dd>
                </div>
              </dl>
              <Link
                href={serviceHref(item.serviceId)}
                className="mt-5 text-sm font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Related service details
              </Link>
            </article>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function PortfolioExplorer() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted">
          Loading portfolio…
        </div>
      }
    >
      <PortfolioExplorerInner />
    </Suspense>
  );
}
