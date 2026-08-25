import type { Metadata } from "next";
import { Suspense } from "react";
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
  if (!event) return { title: "Event not found", robots: { index: false, follow: false } };
  return {
    title: event.title,
    description: event.shortDescription,
    robots: { index: false, follow: false },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted">
          Loading event…
        </div>
      }
    >
      <EventDetailClient event={event} />
    </Suspense>
  );
}
