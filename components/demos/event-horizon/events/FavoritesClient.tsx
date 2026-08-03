"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";
import { EventCard } from "@/components/demos/event-horizon/events/EventCard";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";
import { staggerContainer } from "@/lib/demos/event-horizon/animation";
import type { EventItem } from "@/lib/demos/event-horizon/eventData";

export function FavoritesClient() {
  const { status } = useSession();
  const { favoriteEvents, ready } = useFavorites();
  const { openSignIn } = useAuthModal();

  const liked = favoriteEvents.map(
    (event) =>
      ({
        ...event,
        category: event.category,
        status: event.status,
      }) as EventItem,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Favorites
      </h1>
      <p className="mt-2 text-sm text-muted">
        Saved events sync to your signed-in account.
      </p>

      {status === "unauthenticated" ? (
        <div className="mt-10">
          <EmptyState
            title="Sign in to view favorites"
            description="Favorites are saved to your account so they follow you across browsers."
            icon={Heart}
            actionLabel="Sign In"
            onAction={() =>
              openSignIn({
                type: "navigate",
                href: "/demos/event-horizon/favorites",
              })
            }
            secondaryActionHref="/demos/event-horizon/browse"
            secondaryActionLabel="Browse events"
          />
        </div>
      ) : !ready ? (
        <div className="mt-8">
          <EventGridSkeleton count={3} />
        </div>
      ) : liked.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No favorites yet"
            description="Tap the heart on any event card to save it here for quick access later."
            icon={Heart}
            actionHref="/demos/event-horizon/browse"
            actionLabel="Browse events"
            secondaryActionHref="/demos/event-horizon"
            secondaryActionLabel="Back home"
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
