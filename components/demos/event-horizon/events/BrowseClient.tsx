"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Tag } from "lucide-react";
import {
  DEFAULT_EVENT_FILTERS,
  type EventFilters,
  type EventItem,
} from "@/lib/demos/event-horizon/eventData";
import {
  buildBrowseHref,
  parseEventFilters,
} from "@/lib/demos/event-horizon/filters";
import {
  apiGet,
  type EventsListResponse,
  type PublicEvent,
} from "@/lib/demos/event-horizon/apiClient";
import { SearchInput } from "@/components/demos/event-horizon/ui/SearchInput";
import { FilterSidebar } from "@/components/demos/event-horizon/events/FilterSidebar";
import { EventCard } from "@/components/demos/event-horizon/events/EventCard";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { Modal } from "@/components/demos/event-horizon/ui/Modal";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";
import { staggerContainer } from "@/lib/demos/event-horizon/animation";

function getBrowseEmptyState(filters: EventFilters) {
  const query = filters.query.trim();
  if (query) {
    return {
      title: `No results for “${query}”`,
      description:
        "Try a different keyword, clear your search, or browse by city and category.",
      icon: Search,
      actionLabel: "Clear search",
      secondaryActionLabel: "Clear all filters",
    };
  }
  if (filters.category !== "All") {
    return {
      title: `No ${filters.category} events found`,
      description:
        "Nothing matches this category with your other filters. Widen the search or pick another category.",
      icon: Tag,
      actionLabel: "Clear category",
      secondaryActionLabel: "Clear all filters",
    };
  }
  return {
    title: "No events found",
    description:
      "Try clearing filters or searching a different keyword to rediscover what’s on.",
    icon: SlidersHorizontal,
    actionLabel: "Clear Filters",
    secondaryActionLabel: "Back home",
  };
}

function toEventItem(event: PublicEvent): EventItem {
  return {
    ...event,
    category: event.category as EventItem["category"],
    status: event.status,
  };
}

export function BrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [results, setResults] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => parseEventFilters(searchParams),
    [searchParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (filters.query.trim()) params.set("q", filters.query.trim());
        if (filters.category !== "All") params.set("category", filters.category);
        if (filters.city !== "All") params.set("city", filters.city);
        if (filters.date) params.set("date", filters.date);
        if (filters.sort !== DEFAULT_EVENT_FILTERS.sort) {
          params.set("sort", filters.sort);
        }
        if (filters.featured) params.set("featured", "true");
        params.set("page", "1");
        params.set("pageSize", "24");

        const result = await apiGet<EventsListResponse>(
          `/api/events?${params.toString()}`,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        if (!result.ok) {
          setResults([]);
          setTotal(0);
          setError(result.error.message);
          setLoading(false);
          return;
        }

        setResults(result.data.items.map(toEventItem));
        setTotal(result.data.total);
        setLoading(false);
      })();
    }, filters.query ? 250 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [filters]);

  function commitFilters(next: EventFilters) {
    router.replace(buildBrowseHref(next), { scroll: false });
  }

  function handleSearchChange(value: string) {
    commitFilters({ ...filters, query: value });
  }

  function clearFilters() {
    commitFilters(DEFAULT_EVENT_FILTERS);
    setFiltersOpen(false);
  }

  const activeFilterCount = [
    filters.category !== "All",
    filters.city !== "All",
    Boolean(filters.date),
    filters.featured,
    filters.sort !== DEFAULT_EVENT_FILTERS.sort,
  ].filter(Boolean).length;

  const empty = getBrowseEmptyState(filters);

  function handleEmptyPrimary() {
    if (filters.query.trim()) {
      commitFilters({ ...filters, query: "" });
      return;
    }
    if (filters.category !== "All") {
      commitFilters({ ...filters, category: "All" });
      return;
    }
    clearFilters();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <FilterSidebar
        filters={filters}
        onChange={commitFilters}
        onReset={clearFilters}
        className="hidden lg:block"
      />

      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Browse events
            </h1>
            <p
              className="mt-2 text-sm text-muted"
              aria-live="polite"
              aria-atomic="true"
            >
              {loading
                ? "Loading events…"
                : `${total} event${total === 1 ? "" : "s"} match your filters`}
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

        {error ? (
          <EmptyState
            title="Could not load events"
            description={error}
            actionLabel="Retry"
            onAction={() => commitFilters({ ...filters })}
            secondaryActionHref="/demos/event-horizon"
            secondaryActionLabel="Back home"
          />
        ) : loading ? (
          <EventGridSkeleton count={6} />
        ) : results.length === 0 ? (
          <EmptyState
            title={empty.title}
            description={empty.description}
            icon={empty.icon}
            actionLabel={empty.actionLabel}
            onAction={handleEmptyPrimary}
            secondaryActionLabel={empty.secondaryActionLabel}
            onSecondaryAction={
              empty.secondaryActionLabel === "Back home"
                ? undefined
                : clearFilters
            }
            secondaryActionHref={
              empty.secondaryActionLabel === "Back home"
                ? "/demos/event-horizon"
                : undefined
            }
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
          onChange={commitFilters}
          onReset={clearFilters}
          className="border-0 bg-transparent p-0"
        />
        <Button className="mt-5 w-full" onClick={() => setFiltersOpen(false)}>
          Show {total} event{total === 1 ? "" : "s"}
        </Button>
      </Modal>
    </div>
  );
}
