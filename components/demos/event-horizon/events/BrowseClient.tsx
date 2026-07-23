"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import {
  events,
  filterEvents,
  type EventFilters,
} from "@/lib/demos/event-horizon/eventData";
import { SearchInput } from "@/components/demos/event-horizon/ui/SearchInput";
import { FilterSidebar } from "@/components/demos/event-horizon/events/FilterSidebar";
import { EventCard } from "@/components/demos/event-horizon/events/EventCard";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { Modal } from "@/components/demos/event-horizon/ui/Modal";
import { staggerContainer } from "@/lib/demos/event-horizon/animation";

const DEFAULT_FILTERS: EventFilters = {
  query: "",
  category: "All",
  city: "All",
  date: "",
  sort: "date-asc",
};

export function BrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    ...DEFAULT_FILTERS,
    query: searchParams.get("q") ?? "",
  });

  const results = useMemo(
    () => filterEvents(events, filters),
    [filters],
  );

  function handleSearchChange(value: string) {
    setFilters((prev) => ({ ...prev, query: value }));
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    router.replace(`/demos/event-horizon/browse${params.toString() ? `?${params}` : ""}`);
  }

  function resetBrowse() {
    setFilters(DEFAULT_FILTERS);
    setFiltersOpen(false);
    router.replace("/demos/event-horizon/browse");
  }

  const activeFilterCount = [
    filters.category !== "All",
    filters.city !== "All",
    Boolean(filters.date),
  ].filter(Boolean).length;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        onReset={resetBrowse}
        className="hidden lg:block"
      />

      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Browse events
            </h1>
            <p className="mt-2 text-sm text-muted">
              {results.length} event{results.length === 1 ? "" : "s"} match your
              filters
            </p>
          </div>
          <SearchInput
            value={filters.query}
            onChange={handleSearchChange}
            className="w-full sm:max-w-sm"
            id="browse-search"
          />
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden"
            aria-label={`Open filters${activeFilterCount ? `, ${activeFilterCount} active` : ""}`}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters
            {activeFilterCount ? (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>

        {results.length === 0 ? (
          <EmptyState
            title="No events found"
            description="Try clearing filters or searching a different keyword."
            actionLabel="Reset browse"
            onAction={resetBrowse}
          />
        ) : (
          <motion.div
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        )}
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter events"
      >
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          onReset={resetBrowse}
          className="border-0 bg-transparent p-0"
        />
        <Button className="mt-5 w-full" onClick={() => setFiltersOpen(false)}>
          Show {results.length} event{results.length === 1 ? "" : "s"}
        </Button>
      </Modal>
    </div>
  );
}
