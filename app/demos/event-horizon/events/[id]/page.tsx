import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { events, getEventById } from "@/lib/demos/event-horizon/eventData";
import { EventDetailClient } from "@/components/demos/event-horizon/events/EventDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return events.map((event) => ({ id: event.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();
  return <EventDetailClient event={event} />;
}
