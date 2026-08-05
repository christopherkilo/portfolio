"use client";

import { motion } from "framer-motion";
import type { EventItem } from "@/lib/demos/event-horizon/eventData";
import { EventCard } from "@/components/demos/event-horizon/events/EventCard";
import { staggerContainer } from "@/lib/demos/event-horizon/animation";

export function EventGrid({
  events,
  trendingIds,
}: {
  events: EventItem[];
  trendingIds?: Set<string> | string[];
}) {
  const trending =
    trendingIds instanceof Set
      ? trendingIds
      : new Set(trendingIds ?? []);

  return (
    <motion.div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          trending={trending.has(event.id)}
        />
      ))}
    </motion.div>
  );
}
