import { getFeaturedEvents } from "@/lib/demos/event-horizon/eventData";
import { EventNotFound } from "@/components/demos/event-horizon/events/EventNotFound";

export default function EventDetailNotFound() {
  return <EventNotFound featured={getFeaturedEvents().slice(0, 3)} />;
}
