"use client";

import {
  CATEGORIES,
  CITIES,
  type EventCategory,
  type EventFilters,
  type SortOption,
} from "@/lib/demos/event-horizon/eventData";
import { cn } from "@/lib/demos/event-horizon/utils";

type FilterSidebarProps = {
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
  onReset: () => void;
  className?: string;
};

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
        "h-fit rounded-2xl border border-border bg-surface p-5",
        className,
      )}
      aria-label="Event filters"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Filters</h2>
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Category
        </legend>
        <div className="flex flex-wrap gap-2">
          {(["All", ...CATEGORIES] as const).map((category) => {
            const active = filters.category === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  update("category", category as EventCategory | "All")
                }
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border text-muted hover:border-accent/30 hover:text-ink",
                )}
                aria-pressed={active}
              >
                {category}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-muted">
        Location
        <select
          className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-medium normal-case tracking-normal text-ink outline-none focus:border-accent/50"
          value={filters.city}
          onChange={(e) => update("city", e.target.value)}
        >
          <option value="All">All cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-muted">
        On or after
        <input
          type="date"
          value={filters.date}
          onChange={(e) => update("date", e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-medium normal-case tracking-normal text-ink outline-none focus:border-accent/50"
        />
      </label>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-muted">
        Sort by
        <select
          className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-medium normal-case tracking-normal text-ink outline-none focus:border-accent/50"
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value as SortOption)}
        >
          <option value="date-asc">Date (soonest)</option>
          <option value="date-desc">Date (latest)</option>
          <option value="popular">Most popular</option>
          <option value="title">Title A–Z</option>
        </select>
      </label>
    </aside>
  );
}
