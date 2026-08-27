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
import { ExternalEventCard } from "@/components/demos/event-horizon/events/ExternalEventCard";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { Modal } from "@/components/demos/event-horizon/ui/Modal";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";
import { staggerContainer } from "@/lib/demos/event-horizon/animation";
import {
  fetchExternalEvents,
  filterExternalEvents,
  shouldShowExternalCatalog,
  shouldShowNativeCatalog,
  type ExternalEventsStatus,
  type PublicExternalEvent,
} from "@/lib/demos/event-horizon/externalEvents";

function getBrowseEmptyState(filters: EventFilters) {
  const query = filters.query.trim();
  if (query) {
    return {
      title: "We couldn’t find anything nearby",
      description: `Nothing matched “${query}”. Try expanding your search, or explore another category.`,
      icon: Search,
      actionLabel: "Clear search",
      secondaryActionLabel: "Clear all filters",
    };
  }
  if (filters.category !== "All") {
    return {
      title: "We couldn’t find anything nearby",
      description: `No ${filters.category} events match these filters. Explore another category or widen the criteria.`,
      icon: Tag,
      actionLabel: "Clear category",
      secondaryActionLabel: "Clear all filters",
    };
  }
  return {
    title: "We couldn’t find anything nearby",
    description:
      "Try expanding your search or explore another category — something worth the night is usually close.",
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
  const [externalItems, setExternalItems] = useState<PublicExternalEvent[]>([]);
  const [externalStatus, setExternalStatus] =
    useState<ExternalEventsStatus>("loading");

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
        setExternalStatus("loading");
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

        const showNative = shouldShowNativeCatalog(filters.source);
        const showExternal = shouldShowExternalCatalog(
          filters.source,
          filters.featured,
        );

        const nativePromise = showNative
          ? apiGet<EventsListResponse>(`/api/events?${params.toString()}`, {
              signal: controller.signal,
            })
          : Promise.resolve(null);
        const externalPromise = showExternal
          ? fetchExternalEvents({ signal: controller.signal, limit: 40 })
          : Promise.resolve({ status: "unconfigured" as const, items: [] });

        const [nativeResult, externalResult] = await Promise.all([
          nativePromise,
          externalPromise.catch((error: unknown) => {
            if (controller.signal.aborted) throw error;
            return { status: "unavailable" as const, items: [] };
          }),
        ]);

        if (controller.signal.aborted) return;

        if (nativeResult && !nativeResult.ok) {
          setResults([]);
          setTotal(0);
          setError(nativeResult.error.message);
        } else if (nativeResult?.ok) {
          setResults(nativeResult.data.items.map(toEventItem));
          setTotal(nativeResult.data.total);
        } else {
          setResults([]);
          setTotal(0);
        }

        setExternalItems(externalResult.items);
        setExternalStatus(externalResult.status);
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

  const showNative = shouldShowNativeCatalog(filters.source);
  const showExternal = shouldShowExternalCatalog(filters.source, filters.featured);
  const visibleExternal = filterExternalEvents(externalItems, filters);
  const visibleCount =
    (showNative ? total : 0) + (showExternal && externalStatus === "ok" ? visibleExternal.length : 0);

  const activeFilterCount = [
    filters.category !== "All",
    filters.city !== "All",
    Boolean(filters.date),
    filters.featured,
    filters.sort !== DEFAULT_EVENT_FILTERS.sort,
    filters.source !== DEFAULT_EVENT_FILTERS.source,
  ].filter(Boolean).length;

  const empty = getBrowseEmptyState(filters);
  const nativeErrorBlocksPage = Boolean(error) && showNative && visibleExternal.length === 0;
  const nothingToShow =
    !loading &&
    !nativeErrorBlocksPage &&
    (!showNative || results.length === 0) &&
    (!showExternal || visibleExternal.length === 0);

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
                ? "Pulling events into view…"
                : `${visibleCount} event${visibleCount === 1 ? "" : "s"} match your filters`}
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

        {nativeErrorBlocksPage ? (
          <EmptyState
            title="Signal lost — events unavailable"
            description={
              error ||
              "We could not pull the catalog into view. Retry in a moment, or return home and try again."
            }
            actionLabel="Retry"
            onAction={() => commitFilters({ ...filters })}
            secondaryActionHref="/demos/event-horizon"
            secondaryActionLabel="Back home"
          />
        ) : loading ? (
          <EventGridSkeleton count={6} />
        ) : (
          <div className="space-y-10">
            {error && showNative ? (
              <p className="text-sm text-muted" role="status">
                Event Horizon listings could not be loaded. Ticketmaster discovery may still be
                available below.
              </p>
            ) : null}

            {showNative && results.length > 0 ? (
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
            ) : null}

            {showExternal && externalStatus === "unavailable" ? (
              <p className="text-sm text-muted" role="status">
                External events are temporarily unavailable.
              </p>
            ) : null}

            {showExternal && externalStatus === "loading" ? (
              <EventGridSkeleton count={3} />
            ) : null}

            {showExternal && visibleExternal.length > 0 ? (
              <section aria-labelledby="browse-ticketmaster-heading">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    From Ticketmaster
                  </p>
                  <h2
                    id="browse-ticketmaster-heading"
                    className="mt-2 font-display text-2xl font-bold tracking-tight"
                  >
                    Dallas discovery events
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted">
                    These listings open Ticketmaster. They cannot be reserved through Event Horizon.
                  </p>
                </div>
                <motion.div
                  className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {visibleExternal.map((event) => (
                    <ExternalEventCard
                      key={`${event.provider}-${event.externalId}`}
                      event={event}
                    />
                  ))}
                </motion.div>
              </section>
            ) : null}

            {nothingToShow ? (
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
            ) : null}
          </div>
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
          Show {visibleCount} event{visibleCount === 1 ? "" : "s"}
        </Button>
      </Modal>
    </div>
  );
}
