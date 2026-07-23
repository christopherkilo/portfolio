"use client";

import { CheckCircle2, Heart, LoaderCircle, Share2, Ticket } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { EventItem } from "@/lib/demos/event-horizon/eventData";
import { formatEventDate, formatEventTime, cn } from "@/lib/demos/event-horizon/utils";
import { ImageGallery } from "@/components/demos/event-horizon/events/ImageGallery";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { Modal } from "@/components/demos/event-horizon/ui/Modal";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";

export function EventDetailClient({ event }: { event: EventItem }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState<"general" | "plus">("general");
  const [quantity, setQuantity] = useState(1);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [formError, setFormError] = useState("");
  const liked = isFavorite(event.id);
  const basePrice = Number(event.price.replace(/[^0-9.]/g, "")) || 0;
  const unitPrice = basePrice + (ticketType === "plus" ? 24 : 0);
  const total = unitPrice * quantity;
  const priceLabel = (value: number) => (value === 0 ? "Free" : `$${value}`);

  function closeTickets() {
    if (processing) return;
    setTicketOpen(false);
    window.setTimeout(() => {
      setConfirmed(false);
      setFormError("");
    }, 200);
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setProcessing(false);
    setConfirmed(true);
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
          <p className="mt-4 text-muted">{event.longDescription}</p>

          <dl className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">When</dt>
              <dd className="text-right font-medium">
                {formatEventDate(event.date)} · {formatEventTime(event.date)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Where</dt>
              <dd className="text-right font-medium">
                {event.venue}
                <br />
                {event.location}, {event.city}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Organizer</dt>
              <dd className="font-medium">{event.organizer}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Price</dt>
              <dd className="font-semibold text-accent">{event.price}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Attending</dt>
              <dd className="font-medium">
                {event.attendees.toLocaleString()} people
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setTicketOpen(true)}>
              <Ticket className="size-4" aria-hidden />
              Get tickets
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toggleFavorite(event.id);
                toast(
                  liked
                    ? "Removed from favorites"
                    : "Saved to favorites",
                );
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
        title={confirmed ? "Reservation confirmed" : `Tickets for ${event.title}`}
      >
        {confirmed ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-12 text-accent" aria-hidden />
            <p className="mt-4 font-display text-xl font-semibold">
              You’re on the list, {attendeeName.split(" ")[0]}.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A demo confirmation for {quantity} {ticketType === "plus" ? "Plus" : "General"}{" "}
              ticket{quantity === 1 ? "" : "s"} has been prepared for {attendeeEmail}.
              No payment was collected and no real reservation was created.
            </p>
            <div className="mt-5 rounded-xl border border-border bg-bg/60 p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Reference</span>
                <span className="font-mono font-medium">EH-DEMO-{event.id.slice(0, 4).toUpperCase()}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-muted">Total</span>
                <span className="font-semibold">{priceLabel(total)}</span>
              </div>
            </div>
            <Button className="mt-6 w-full" onClick={closeTickets}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submitReservation} noValidate>
            <p className="text-sm text-muted">
              Choose your experience and attendee details. This portfolio demo
              will not charge you or create a real booking.
            </p>

            <fieldset className="mt-5">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
                Ticket type
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {([
                  ["general", "General", basePrice, "Event admission"],
                  ["plus", "Plus", basePrice + 24, "Admission + priority entry"],
                ] as const).map(([value, label, price, description]) => (
                  <label
                    key={value}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 transition",
                      ticketType === value
                        ? "border-accent/50 bg-accent/10"
                        : "border-border bg-bg/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="ticket-type"
                      value={value}
                      checked={ticketType === value}
                      onChange={() => setTicketType(value)}
                      className="sr-only"
                    />
                    <span className="flex justify-between gap-2 text-sm font-semibold">
                      {label}
                      <span className="text-accent">{priceLabel(price)}</span>
                    </span>
                    <span className="mt-1 block text-xs text-muted">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 grid gap-4 sm:grid-cols-[110px_1fr]">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                Quantity
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-ink"
                >
                  {[1, 2, 3, 4, 5, 6].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                Lead attendee
                <input
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  autoComplete="name"
                  placeholder="Full name"
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm normal-case tracking-normal text-ink"
                />
              </label>
            </div>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted">
              Confirmation email
              <input
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm normal-case tracking-normal text-ink"
              />
            </label>

            {formError ? (
              <p className="mt-3 text-sm text-warm" role="alert">{formError}</p>
            ) : null}

            <div className="mt-5 rounded-xl border border-border bg-bg/60 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">
                  {quantity} × {ticketType === "plus" ? "Plus" : "General"}
                </span>
                <span className="font-semibold">{priceLabel(total)}</span>
              </div>
              <p className="mt-2 border-t border-border pt-2 text-xs text-muted">
                Demo checkout · no payment details required
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeTickets} disabled={processing}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Reserving…
                  </>
                ) : (
                  `Reserve · ${priceLabel(total)}`
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
