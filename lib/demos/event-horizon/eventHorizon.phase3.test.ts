/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_EVENT_FILTERS,
  events,
  filterEvents,
} from "./eventData";
import {
  buildBrowseHref,
  parseEventFilters,
  serializeEventFilters,
} from "./filters";
import {
  focusFirstElement,
  getFocusableElements,
  handleFocusTrapTab,
} from "./focusTrap";
import {
  addReservation,
  cancelReservation,
  createReservationRecord,
  deleteReservation,
  getReservationDisplayStatus,
  loadReservationsFromStorage,
  sanitizeReservationList,
} from "./reservationRecords";
import {
  calculateReservationTotals,
  createConfirmationNumber,
  validateReservation,
} from "./reservation";
import {
  loadFavoritesFromStorage,
  sanitizeFavoriteIds,
} from "./favoritesStorage";
import { isEventNotFoundRoute, resolveEventRoute } from "./routes";

function mountTrapFixture() {
  document.body.innerHTML = `
    <div id="outside"><button type="button" id="outside-btn">Outside</button></div>
    <div id="dialog" role="dialog">
      <button type="button" data-autofocus id="close">Close</button>
      <a href="/demos/event-horizon/browse" id="browse">Browse</a>
      <button type="button" id="done">Done</button>
    </div>
  `;
  return document.getElementById("dialog") as HTMLElement;
}

describe("keyboard focus trap (mobile menu / dialogs)", () => {
  it("lists focusable controls and focuses the autofocus target", () => {
    const dialog = mountTrapFixture();
    const focusable = getFocusableElements(dialog);
    expect(focusable.map((el) => el.id)).toEqual(["close", "browse", "done"]);
    focusFirstElement(dialog);
    expect(document.activeElement?.id).toBe("close");
  });

  it("cycles Tab and Shift+Tab inside the container", () => {
    const dialog = mountTrapFixture();
    const close = document.getElementById("close") as HTMLButtonElement;
    const done = document.getElementById("done") as HTMLButtonElement;
    close.focus();

    const tab = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    // Move to last, then Tab should wrap to first
    done.focus();
    expect(handleFocusTrapTab(tab, dialog)).toBe(true);
    expect(document.activeElement?.id).toBe("close");

    const shiftTab = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    close.focus();
    expect(handleFocusTrapTab(shiftTab, dialog)).toBe(true);
    expect(document.activeElement?.id).toBe("done");
  });
});

describe("reservation user flow", () => {
  it("reserves, persists, cancels, then permanently deletes", () => {
    const event = events.find((item) => item.status === "upcoming")!;
    const ticket = event.ticketTypes.find(
      (item) => item.availability !== "sold-out" && item.quantityRemaining > 0,
    )!;

    const validation = validateReservation(event, ticket.id, 2);
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;

    const totals = calculateReservationTotals(ticket.price, 2);
    const confirmationNumber = createConfirmationNumber("flowtest01");
    const record = createReservationRecord({
      confirmationNumber,
      event,
      ticket: validation.ticket,
      quantity: 2,
    });
    expect(record.total).toBe(totals.total);

    let list = addReservation([], record);
    const serialized = JSON.stringify(list);
    list = loadReservationsFromStorage(serialized);
    expect(list).toHaveLength(1);
    expect(getReservationDisplayStatus(list[0]!)).toBe("Upcoming");

    list = cancelReservation(list, confirmationNumber);
    expect(list[0]?.status).toBe("Cancelled");
    expect(getReservationDisplayStatus(list[0]!)).toBe("Cancelled");

    list = deleteReservation(list, confirmationNumber);
    expect(list).toHaveLength(0);
  });

  it("blocks sold-out reservation attempts", () => {
    const soldOut = events.find((item) => item.status === "sold-out");
    if (!soldOut) return;
    const ticketId = soldOut.ticketTypes[0]?.id ?? "";
    const result = validateReservation(soldOut, ticketId, 1);
    expect(result.ok).toBe(false);
  });
});

describe("favorites and ticket management behaviors", () => {
  it("keeps favorites durable across a storage round-trip", () => {
    const ids = [events[0]!.id, events[1]!.id];
    const raw = JSON.stringify(ids);
    expect(loadFavoritesFromStorage(raw)).toEqual(ids);
    expect(
      sanitizeFavoriteIds([...ids, "missing", ids[0]], new Set(ids)),
    ).toEqual(ids);
  });

  it("retains orphaned tickets when an event is removed from the catalog", () => {
    const orphan = createReservationRecord({
      confirmationNumber: "EH-GONE-0001",
      event: events[0]!,
      ticket: events[0]!.ticketTypes[0]!,
      quantity: 1,
    });
    orphan.eventId = "removed-event";
    orphan.eventTitle = "Removed Festival";

    const cleaned = sanitizeReservationList([orphan], {
      knownEventIds: new Set(events.map((event) => event.id)),
    });
    expect(cleaned[0]?.eventTitle).toBe("Removed Festival");
  });
});

describe("URL synchronized browsing", () => {
  it("shares and restores a filter selection through the query string", () => {
    const filters = {
      ...DEFAULT_EVENT_FILTERS,
      query: "synth",
      category: "Music" as const,
      city: "Austin",
      sort: "popular" as const,
      featured: true,
    };

    const href = buildBrowseHref(filters);
    expect(href).toContain("/demos/event-horizon/browse?");
    expect(href).toContain("q=synth");
    expect(href).toContain("category=Music");
    expect(href).toContain("city=Austin");
    expect(href).toContain("sort=popular");
    expect(href).toContain("featured=true");

    const restored = parseEventFilters(new URLSearchParams(href.split("?")[1]));
    expect(restored.query).toBe("synth");
    expect(restored.category).toBe("Music");
    expect(restored.city).toBe("Austin");
    expect(restored.sort).toBe("popular");
    expect(restored.featured).toBe(true);

    const results = filterEvents(events, restored);
    expect(results.every((event) => event.category === "Music")).toBe(true);
  });

  it("clears unused params when filters reset", () => {
    expect(serializeEventFilters(DEFAULT_EVENT_FILTERS)).toBe("");
    expect(buildBrowseHref(DEFAULT_EVENT_FILTERS)).toBe(
      "/demos/event-horizon/browse",
    );
  });
});

describe("error recovery and not-found routing", () => {
  it("maps unknown event ids to not-found without throwing", () => {
    expect(isEventNotFoundRoute("totally-missing-event")).toBe(true);
    expect(resolveEventRoute("totally-missing-event").status).toBe("not-found");
    expect(resolveEventRoute(events[0]!.id).status).toBe("found");
  });

  it("recovers from corrupted reservation storage", () => {
    expect(loadReservationsFromStorage("{not-json")).toEqual([]);
    expect(loadReservationsFromStorage("[]")).toEqual([]);
  });
});
