"use client";

import { motion } from "framer-motion";
import { events } from "@/lib/demos/event-horizon/eventData";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { EventCard } from "@/components/demos/event-horizon/events/EventCard";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";
import { staggerContainer } from "@/lib/demos/event-horizon/animation";

export function FavoritesClient() {
  const { favorites, ready } = useFavorites();
  const liked = events.filter((event) => favorites.includes(event.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Favorites
      </h1>
      <p className="mt-2 text-sm text-muted">
        Your saved events stay private to this browser.
      </p>

      {!ready ? (
        <div className="mt-8">
          <EventGridSkeleton count={3} />
        </div>
      ) : liked.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No favorites yet"
            description="Tap the heart on any event card to save it here."
            actionHref="/demos/event-horizon/browse"
            actionLabel="Browse events"
          />
        </div>
      ) : (
        <motion.div
          className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {liked.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
