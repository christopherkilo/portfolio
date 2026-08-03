"use client";

import { CheckCircle2, Heart, LoaderCircle, Share2, Ticket } from "lucide-react";
import { type FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  formatTicketPrice,
  getEventPriceLabel,
  getInterestScore,
  type EventItem,
  type TicketType,
} from "@/lib/demos/event-horizon/eventData";
import {
  calculateReservationTotals,
  validateReservation,
} from "@/lib/demos/event-horizon/reservation";
import {
  formatCurrency,
  formatEventDate,
  formatEventTime,
  cn,
} from "@/lib/demos/event-horizon/utils";
import { ImageGallery } from "@/components/demos/event-horizon/events/ImageGallery";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { Modal } from "@/components/demos/event-horizon/ui/Modal";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useReservations } from "@/contexts/demos/event-horizon/ReservationsContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";
import { loadAuthIntent } from "@/lib/demos/event-horizon/authIntent";

type Confirmation = {
  code: string;
  ticket: TicketType;
  quantity: number;
  subtotal: number;
  fees: number;
  total: number;
};

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `eh_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `eh_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function EventDetailClient({ event }: { event: EventItem }) {
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addTicketReservation } = useReservations();
  const { toast } = useToast();
  const { openSignIn } = useAuthModal();
  const formIds = useId();
  const ticketHintId = `${formIds}-ticket-hint`;
  const quantityId = `${formIds}-quantity`;
  const quantityHintId = `${formIds}-quantity-hint`;
  const nameId = `${formIds}-name`;
  const nameHintId = `${formIds}-name-hint`;
  const emailId = `${formIds}-email`;
  const emailHintId = `${formIds}-email-hint`;
  const errorId = `${formIds}-error`;
  const totalsId = `${formIds}-totals`;
  const [ticketOpen, setTicketOpen] = useState(false);
  const defaultTicketId =
    event.ticketTypes.find(
      (ticket) =>
        ticket.availability !== "sold-out" && ticket.quantityRemaining > 0,
    )?.id ?? event.ticketTypes[0]?.id ?? "";
  const [ticketId, setTicketId] = useState(defaultTicketId);
  const [quantity, setQuantity] = useState(1);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [formError, setFormError] = useState("");
  const idempotencyKeyRef = useRef(createIdempotencyKey());
  const resumeOpenedRef = useRef(false);
  const liked = isFavorite(event.id);
  const interest = getInterestScore(event);

  const selectedTicket = useMemo(
    () => event.ticketTypes.find((ticket) => ticket.id === ticketId),
    [event.ticketTypes, ticketId],
  );

  const totals = useMemo(
    () =>
      calculateReservationTotals(selectedTicket?.price ?? 0, quantity),
    [selectedTicket?.price, quantity],
  );

  const maxQuantity = selectedTicket
    ? Math.min(selectedTicket.purchaseLimit, selectedTicket.quantityRemaining)
    : 0;

  const reservationsClosed =
    event.status !== "upcoming" ||
    event.ticketTypes.every(
      (ticket) =>
        ticket.availability === "sold-out" || ticket.quantityRemaining <= 0,
    );

  function closeTickets() {
    if (processing) return;
    setTicketOpen(false);
    window.setTimeout(() => {
      setConfirmation(null);
      setFormError("");
    }, 200);
  }

  function openTickets() {
    if (authStatus !== "authenticated") {
      openSignIn({
        type: "reserve",
        eventId: event.id,
        eventSlug: event.slug,
        ticketTypeId: ticketId || defaultTicketId,
        quantity,
      });
      return;
    }
    setTicketId(defaultTicketId);
    setQuantity(1);
    setConfirmation(null);
    setFormError("");
    idempotencyKeyRef.current = createIdempotencyKey();
    setTicketOpen(true);
  }

  useEffect(() => {
    if (resumeOpenedRef.current) return;
    if (authStatus !== "authenticated") return;
    if (searchParams.get("reserve") !== "1") return;

    const task = window.setTimeout(() => {
      if (resumeOpenedRef.current) return;
      resumeOpenedRef.current = true;
      const ticketFromQuery = searchParams.get("ticket");
      const qtyFromQuery = Number(searchParams.get("qty"));
      const intent = loadAuthIntent();
      const resumedTicketId =
        ticketFromQuery ||
        (intent?.type === "reserve" && intent.eventId === event.id
          ? intent.ticketTypeId
          : undefined);
      const resumedQuantity =
        Number.isInteger(qtyFromQuery) && qtyFromQuery >= 1
          ? qtyFromQuery
          : intent?.type === "reserve" && intent.eventId === event.id
            ? intent.quantity
            : undefined;

      setTicketId(
        resumedTicketId &&
          event.ticketTypes.some((ticket) => ticket.id === resumedTicketId)
          ? resumedTicketId
          : defaultTicketId,
      );
      setQuantity(
        typeof resumedQuantity === "number" && resumedQuantity >= 1
          ? resumedQuantity
          : 1,
      );
      setConfirmation(null);
      setFormError("");
      idempotencyKeyRef.current = createIdempotencyKey();
      setTicketOpen(true);
    }, 0);

    return () => window.clearTimeout(task);
  }, [authStatus, searchParams, event.id, event.ticketTypes, defaultTicketId]);

  async function submitReservation(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    if (authStatus !== "authenticated") {
      setFormError("Please sign in to reserve tickets.");
      return;
    }

    const validation = validateReservation(event, ticketId, quantity);
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }

    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      setFormError("Enter the lead attendee’s name and email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setFormError("");
    setProcessing(true);

    const result = await addTicketReservation({
      event,
      ticketTypeId: ticketId,
      quantity,
      idempotencyKey: idempotencyKeyRef.current,
    });

    if (!result.ok) {
      setFormError(result.message);
      if (result.status === 401) {
        toast("Please sign in to reserve tickets.");
      }
      setProcessing(false);
      return;
    }

    const server = result.reservation;
    setConfirmation({
      code: server.confirmationNumber,
      ticket: validation.ticket,
      quantity: server.quantity,
      subtotal: server.subtotal,
      fees: server.fees,
      total: server.total,
    });
    toast(
      result.replayed
        ? "This reservation was already created."
        : "Reservation saved to My Tickets",
    );
    setProcessing(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <ImageGallery images={event.gallery} alt={event.title} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {event.category}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {event.title}
          </h1>
          <p className="mt-4 text-muted">{event.description}</p>

          <dl className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">When</dt>
              <dd className="text-right font-medium">
                {formatEventDate(event.startDateTime, event.timezone)} ·{" "}
                {formatEventTime(event.startDateTime, event.timezone)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Where</dt>
              <dd className="text-right font-medium">
                {event.venue}
                <br />
                {event.address}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Organizer</dt>
              <dd className="font-medium">{event.organizer}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd className="font-medium capitalize">
                {event.status.replace("-", " ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tickets</dt>
              <dd className="font-semibold text-accent">
                {getEventPriceLabel(event)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Capacity</dt>
              <dd className="font-medium">
                {interest.toLocaleString()} / {event.capacity.toLocaleString()}
              </dd>
            </div>
          </dl>

          {event.tags.length ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
              {event.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-lg border border-border bg-bg/50 px-2.5 py-1 text-xs text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={openTickets} disabled={reservationsClosed}>
              <Ticket className="size-4" aria-hidden />
              {reservationsClosed ? "Unavailable" : "Get tickets"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void (async () => {
                  const result = await toggleFavorite(event.id);
                  if (result === "auth") {
                    openSignIn({
                      type: "favorite",
                      eventId: event.id,
                      eventSlug: event.slug,
                    });
                    return;
                  }
                  if (result === "error") {
                    toast("We could not update favorites. Please try again.");
                    return;
                  }
                  toast(
                    liked
                      ? "Removed from favorites"
                      : "Saved to favorites",
                  );
                })();
              }}
              aria-pressed={liked}
            >
              <Heart
                className={cn("size-4", liked && "fill-current text-warm")}
                aria-hidden
              />
              {liked ? "Favorited" : "Favorite"}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                const url = window.location.href;
                try {
                  await navigator.clipboard.writeText(url);
                  toast("Link copied to clipboard");
                } catch {
                  toast("Unable to copy link");
                }
              }}
            >
              <Share2 className="size-4" aria-hidden />
              Share
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={ticketOpen}
        onClose={closeTickets}
        title={
          confirmation
            ? "Reservation confirmed"
            : `Tickets for ${event.title}`
        }
        description={
          confirmation
            ? "Your demo reservation was saved. Review the confirmation summary."
            : "Choose a ticket type and quantity. No payment is collected in this demo."
        }
      >
        {confirmation ? (
          <div aria-live="polite">
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden />
              <p className="mt-4 font-display text-xl font-semibold">
                You’re on the list
                {attendeeName.trim()
                  ? `, ${attendeeName.trim().split(" ")[0]}`
                  : ""}
                .
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Demo confirmation only — no payment was collected and no real
                reservation was created.
              </p>
            </div>
            <dl className="mt-5 space-y-2 rounded-xl border border-border bg-bg/60 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Event</dt>
                <dd className="text-right font-medium">{event.title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Date</dt>
                <dd className="text-right font-medium">
                  {formatEventDate(event.startDateTime, event.timezone)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Ticket</dt>
                <dd className="text-right font-medium">
                  {confirmation.ticket.name}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Quantity</dt>
                <dd className="font-medium">{confirmation.quantity}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium">
                  {formatCurrency(confirmation.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Service fees</dt>
                <dd className="font-medium">
                  {formatCurrency(confirmation.fees)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2">
                <dt className="text-muted">Total</dt>
                <dd className="font-semibold text-accent">
                  {formatCurrency(confirmation.total)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Confirmation</dt>
                <dd className="font-mono font-medium">{confirmation.code}</dd>
              </div>
            </dl>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button href="/demos/event-horizon/tickets" className="w-full">
                View My Tickets
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={closeTickets}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitReservation} noValidate>
            <p id={ticketHintId} className="text-sm text-muted">
              Choose a ticket type and quantity. This portfolio demo will not
              charge you or create a real booking.
            </p>

            <fieldset className="mt-5" aria-describedby={ticketHintId}>
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
                Ticket type
              </legend>
              <div className="mt-2 grid gap-2">
                {event.ticketTypes.map((ticket) => {
                  const unavailable =
                    ticket.availability === "sold-out" ||
                    ticket.quantityRemaining <= 0;
                  const optionHintId = `${formIds}-ticket-${ticket.id}-hint`;
                  return (
                    <label
                      key={ticket.id}
                      className={cn(
                        "rounded-xl border p-3 transition focus-within:ring-2 focus-within:ring-accent/40",
                        unavailable
                          ? "cursor-not-allowed opacity-55"
                          : "cursor-pointer",
                        ticketId === ticket.id
                          ? "border-accent/50 bg-accent/10"
                          : "border-border bg-bg/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="ticket-type"
                        value={ticket.id}
                        checked={ticketId === ticket.id}
                        disabled={unavailable}
                        aria-describedby={optionHintId}
                        onChange={() => {
                          setTicketId(ticket.id);
                          setQuantity(1);
                          setFormError("");
                        }}
                        className="sr-only"
                      />
                      <span className="flex justify-between gap-2 text-sm font-semibold">
                        {ticket.name}
                        <span className="text-accent">
                          {formatTicketPrice(ticket.price)}
                        </span>
                      </span>
                      <span id={optionHintId} className="mt-1 block text-xs text-muted">
                        {ticket.description}
                        {" · "}
                        {unavailable
                          ? "Sold out"
                          : `${ticket.quantityRemaining} remaining · limit ${ticket.purchaseLimit}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5 grid gap-4 sm:grid-cols-[110px_1fr]">
              <div>
                <label
                  htmlFor={quantityId}
                  className="text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Quantity
                </label>
                <select
                  id={quantityId}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={maxQuantity < 1}
                  aria-describedby={quantityHintId}
                  aria-invalid={Boolean(formError)}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-ink outline-none focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50"
                >
                  {maxQuantity < 1 ? (
                    <option value={0}>0</option>
                  ) : (
                    Array.from({ length: maxQuantity }, (_, i) => i + 1).map(
                      (value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ),
                    )
                  )}
                </select>
                <p id={quantityHintId} className="mt-1 text-xs text-muted">
                  {selectedTicket
                    ? `Up to ${maxQuantity} for ${selectedTicket.name}`
                    : "Select a ticket type first"}
                </p>
              </div>
              <div>
                <label
                  htmlFor={nameId}
                  className="text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Lead attendee
                </label>
                <input
                  id={nameId}
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  autoComplete="name"
                  placeholder="Full name"
                  required
                  aria-required="true"
                  aria-describedby={nameHintId}
                  aria-invalid={Boolean(formError)}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm normal-case tracking-normal text-ink outline-none focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/30"
                />
                <p id={nameHintId} className="mt-1 text-xs text-muted">
                  Name shown on the confirmation summary
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor={emailId}
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Confirmation email
              </label>
              <input
                id={emailId}
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                required
                aria-required="true"
                aria-describedby={emailHintId}
                aria-invalid={Boolean(formError)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm normal-case tracking-normal text-ink outline-none focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/30"
              />
              <p id={emailHintId} className="mt-1 text-xs text-muted">
                Demo only — nothing is emailed
              </p>
            </div>

            <div
              id={errorId}
              className="mt-3 min-h-[1.25rem] text-sm text-warm"
              role="alert"
              aria-live="assertive"
            >
              {formError || null}
            </div>

            <div
              id={totalsId}
              className="mt-2 space-y-2 rounded-xl border border-border bg-bg/60 p-4 text-sm"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex justify-between gap-4">
                <span className="text-muted">
                  {quantity} × {selectedTicket?.name ?? "Ticket"}
                </span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Service fees</span>
                <span className="font-medium">
                  {formatCurrency(totals.fees)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2">
                <span className="text-muted">Estimated total</span>
                <span className="font-semibold text-accent">
                  {formatCurrency(totals.total)}
                </span>
              </div>
              <p className="text-xs text-muted">
                Demo checkout · no payment details required
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={closeTickets}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing || reservationsClosed || maxQuantity < 1}
                aria-describedby={totalsId}
              >
                {processing ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    <span>Reserving…</span>
                    <span className="sr-only">Please wait</span>
                  </>
                ) : (
                  `Reserve · ${formatCurrency(totals.total)}`
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
