"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Ban, CalendarDays, Search, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import type { PublicReservation } from "@/lib/demos/event-horizon/apiClient";
import {
  cn,
  formatCurrency,
  formatEventDate,
} from "@/lib/demos/event-horizon/utils";
import { useReservations } from "@/contexts/demos/event-horizon/ReservationsContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { EmptyState } from "@/components/demos/event-horizon/ui/EmptyState";
import { EventGridSkeleton } from "@/components/demos/event-horizon/ui/Skeleton";

type StatusFilter = "All" | PublicReservation["status"];

const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Upcoming",
  "Completed",
  "Cancelled",
];

function statusBadgeClass(status: PublicReservation["status"]) {
  switch (status) {
    case "Upcoming":
      return "bg-accent/15 text-accent";
    case "Completed":
      return "bg-surface-elevated text-muted";
    case "Cancelled":
      return "bg-warm/15 text-warm";
  }
}

function ReservationCard({
  reservation,
  onCancel,
}: {
  reservation: PublicReservation;
  onCancel: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--card-shadow)]">
      <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
        <div className="relative aspect-[16/10] bg-surface-elevated sm:aspect-auto sm:min-h-[160px]">
          <Image
            src={reservation.eventImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 140px"
          />
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {reservation.eventTitle}
              </h2>
              <p className="mt-1 text-sm text-muted">{reservation.venue}</p>
            </div>
            <span
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold",
                statusBadgeClass(reservation.status),
              )}
            >
              {reservation.status}
            </span>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted">Ticket</dt>
              <dd className="font-medium">
                {reservation.ticketType} × {reservation.quantity}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted">Total</dt>
              <dd className="font-semibold text-accent">
                {formatCurrency(reservation.total)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted">Event date</dt>
              <dd className="font-medium">
                {formatEventDate(reservation.eventDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted">Reserved</dt>
              <dd className="font-medium">
                {formatEventDate(reservation.reservedAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:col-span-2 sm:block">
              <dt className="text-muted">Confirmation</dt>
              <dd className="font-mono text-xs font-medium sm:mt-0.5">
                {reservation.confirmationNumber}
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button
              href={`/demos/event-horizon/events/${reservation.eventId}`}
              variant="outline"
              size="sm"
            >
              View Event
            </Button>
            {reservation.status === "Upcoming" ? (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <Ban className="size-4" aria-hidden />
                Cancel Reservation
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function getEmptyCopy(
  filter: StatusFilter,
  hasAny: boolean,
): {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  resetToAll?: boolean;
} {
  if (!hasAny) {
    return {
      title: "No tickets yet",
      description:
        "Reserve seats from any event page. Confirmed tickets sync to your account.",
      icon: Ticket,
      actionLabel: "Browse events",
      actionHref: "/demos/event-horizon/browse",
      secondaryActionLabel: "Back home",
      secondaryActionHref: "/demos/event-horizon",
    };
  }

  if (filter === "Cancelled") {
    return {
      title: "No cancelled reservations",
      description:
        "Cancelled tickets remain in your history. Nothing is cancelled right now.",
      icon: Ban,
      actionLabel: "View all tickets",
      resetToAll: true,
      secondaryActionLabel: "Browse events",
      secondaryActionHref: "/demos/event-horizon/browse",
    };
  }

  if (filter === "Completed") {
    return {
      title: "No completed events yet",
      description:
        "After an event date passes, those reservations move here so you can keep a record.",
      icon: CalendarDays,
      actionLabel: "View all tickets",
      resetToAll: true,
      secondaryActionLabel: "Browse events",
      secondaryActionHref: "/demos/event-horizon/browse",
    };
  }

  if (filter === "Upcoming") {
    return {
      title: "No upcoming reservations",
      description:
        "You do not have active tickets on the calendar. Discover something new to reserve.",
      icon: Ticket,
      actionLabel: "Browse events",
      actionHref: "/demos/event-horizon/browse",
      secondaryActionLabel: "View all tickets",
    };
  }

  return {
    title: "No reservations to show",
    description: "Try another filter or explore the catalog.",
    icon: Search,
    actionLabel: "Browse events",
    actionHref: "/demos/event-horizon/browse",
  };
}

export function TicketsClient() {
  const { status: authStatus } = useSession();
  const { reservations, ready, cancelTicketReservation } = useReservations();
  const { toast } = useToast();
  const { openSignIn } = useAuthModal();
  const [filter, setFilter] = useState<StatusFilter>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return reservations;
    return reservations.filter((item) => item.status === filter);
  }, [reservations, filter]);

  const counts = useMemo(() => {
    const next = {
      All: reservations.length,
      Upcoming: 0,
      Completed: 0,
      Cancelled: 0,
    };
    for (const item of reservations) {
      next[item.status] += 1;
    }
    return next;
  }, [reservations]);

  const empty = getEmptyCopy(filter, reservations.length > 0);

  if (authStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          My Tickets
        </h1>
        <div className="mt-10">
          <EmptyState
            title="Sign in to view tickets"
            description="Reservations are stored on your account. Sign in to review, cancel, or revisit confirmations."
            icon={Ticket}
            actionLabel="Sign In"
            onAction={() =>
              openSignIn({
                type: "navigate",
                href: "/demos/event-horizon/tickets",
              })
            }
            secondaryActionHref="/demos/event-horizon/browse"
            secondaryActionLabel="Browse events"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        My Tickets
      </h1>
      <p className="mt-2 text-sm text-muted">
        Confirmed demo reservations sync to your account. Cancel keeps history;
        hard deletion of reservation records is disabled to preserve audit
        integrity.
      </p>

      {!ready ? (
        <div className="mt-8">
          <EventGridSkeleton count={3} />
        </div>
      ) : (
        <>
          <div
            className="mt-6 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Reservation status"
          >
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={filter === status}
                onClick={() => setFilter(status)}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-sm font-medium transition",
                  filter === status
                    ? "bg-accent/15 text-accent"
                    : "bg-surface text-muted hover:bg-surface-elevated hover:text-ink",
                )}
              >
                {status}
                <span className="ml-1.5 text-xs opacity-80">
                  {counts[status]}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title={empty.title}
                description={empty.description}
                icon={empty.icon}
                actionLabel={empty.actionLabel}
                actionHref={empty.resetToAll ? undefined : empty.actionHref}
                onAction={
                  empty.resetToAll ? () => setFilter("All") : undefined
                }
                secondaryActionLabel={empty.secondaryActionLabel}
                secondaryActionHref={
                  empty.secondaryActionLabel === "View all tickets"
                    ? undefined
                    : empty.secondaryActionHref
                }
                onSecondaryAction={
                  empty.secondaryActionLabel === "View all tickets"
                    ? () => setFilter("All")
                    : undefined
                }
              />
            </div>
          ) : (
            <ul className="mt-8 grid gap-5">
              {filtered.map((reservation) => (
                <li key={reservation.id}>
                  <ReservationCard
                    reservation={reservation}
                    onCancel={() => {
                      void (async () => {
                        const result = await cancelTicketReservation(
                          reservation.id,
                        );
                        if (result === "auth") {
                          toast("Please sign in to manage tickets.");
                          return;
                        }
                        if (result === "error") {
                          toast("Unable to cancel reservation.");
                          return;
                        }
                        toast("Reservation cancelled");
                      })();
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
