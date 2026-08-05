"use client";

import type { CSSProperties } from "react";
import {
  CATEGORIES,
  CITIES,
  type EventCategory,
  type EventFilters,
  type SortOption,
} from "@/lib/demos/event-horizon/eventData";
import { getCategoryAccent } from "@/lib/demos/event-horizon/categoryStyles";
import { cn } from "@/lib/demos/event-horizon/utils";

type FilterSidebarProps = {
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
  onReset: () => void;
  className?: string;
};

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-medium normal-case tracking-normal text-ink outline-none focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/30";

export function FilterSidebar({
  filters,
  onChange,
  onReset,
  className,
}: FilterSidebarProps) {
  function update<K extends keyof EventFilters>(key: K, value: EventFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside
      className={cn(
        "eh-card h-fit rounded-2xl border bg-surface/90 p-5 backdrop-blur-sm",
        className,
      )}
      aria-label="Event filters"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Filters</h2>
        <button
          type="button"
          className="rounded-sm text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={onReset}
        >
          Clear Filters
        </button>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Category
        </legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
          {(["All", ...CATEGORIES] as const).map((category) => {
            const active = filters.category === category;
            const accent =
              category === "All" ? null : getCategoryAccent(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  update("category", category as EventCategory | "All")
                }
                className={cn(
                  "eh-cat-chip rounded-lg border px-2.5 py-1.5 text-xs font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active && !accent
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : !accent
                      ? "border-border text-muted hover:border-accent/30 hover:text-ink"
                      : active
                        ? undefined
                        : "border-border text-muted",
                )}
                style={
                  accent
                    ? ({
                        ["--eh-cat" as string]: accent.color,
                        ...(active
                          ? {
                              borderColor: accent.border,
                              backgroundColor: accent.wash,
                              color: accent.color,
                            }
                          : undefined),
                      } as CSSProperties)
                    : undefined
                }
                aria-pressed={active}
              >
                {category}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <label
          htmlFor="eh-filter-city"
          className="block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Location
        </label>
        <select
          id="eh-filter-city"
          className={fieldClass}
          value={filters.city}
          onChange={(e) => update("city", e.target.value)}
          aria-describedby="eh-filter-city-hint"
        >
          <option value="All">All cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <p id="eh-filter-city-hint" className="mt-1 text-xs text-muted">
          Filter events by city
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="eh-filter-date"
          className="block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          On or after
        </label>
        <input
          id="eh-filter-date"
          type="date"
          value={filters.date}
          onChange={(e) => update("date", e.target.value)}
          className={fieldClass}
          aria-describedby="eh-filter-date-hint"
        />
        <p id="eh-filter-date-hint" className="mt-1 text-xs text-muted">
          Show events starting on this date or later
        </p>
      </div>

      <div className="mt-5">
        <label className="flex items-center gap-3 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={filters.featured}
            onChange={(e) => update("featured", e.target.checked)}
            className="size-4 rounded border-border accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-describedby="eh-filter-featured-hint"
          />
          Featured only
        </label>
        <p id="eh-filter-featured-hint" className="mt-1 text-xs text-muted">
          Limit results to curated featured events
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="eh-filter-sort"
          className="block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Sort by
        </label>
        <select
          id="eh-filter-sort"
          className={fieldClass}
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value as SortOption)}
          aria-describedby="eh-filter-sort-hint"
        >
          <option value="date-asc">Date (soonest)</option>
          <option value="date-desc">Date (latest)</option>
          <option value="popular">Most popular</option>
          <option value="title">Title A–Z</option>
        </select>
        <p id="eh-filter-sort-hint" className="mt-1 text-xs text-muted">
          Change how matching events are ordered
        </p>
      </div>
    </aside>
  );
}
