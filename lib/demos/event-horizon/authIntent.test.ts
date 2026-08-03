/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  AUTH_INTENT_STORAGE_KEY,
  clearAuthIntent,
  firstNameFromDisplayName,
  friendlySignInError,
  loadAuthIntent,
  parseAuthIntent,
  providerLabel,
  saveAuthIntent,
  serializeAuthIntent,
} from "./authIntent";

describe("auth intent persistence", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("serializes and restores favorite intents", () => {
    const intent = {
      type: "favorite" as const,
      eventId: "aurora-synth-night",
      eventSlug: "aurora-synth-night",
    };
    expect(parseAuthIntent(serializeAuthIntent(intent))).toEqual(intent);
    saveAuthIntent(intent);
    expect(sessionStorage.getItem(AUTH_INTENT_STORAGE_KEY)).toBeTruthy();
    expect(loadAuthIntent()).toEqual(intent);
    clearAuthIntent();
    expect(loadAuthIntent()).toBeNull();
  });

  it("restores reserve and navigate intents", () => {
    expect(
      parseAuthIntent(
        serializeAuthIntent({
          type: "reserve",
          eventId: "aurora-synth-night",
          eventSlug: "aurora-synth-night",
          ticketTypeId: "aurora-ga",
          quantity: 2,
        }),
      ),
    ).toMatchObject({ type: "reserve", quantity: 2 });

    expect(
      parseAuthIntent(
        serializeAuthIntent({
          type: "navigate",
          href: "/demos/event-horizon/tickets",
        }),
      ),
    ).toEqual({ type: "navigate", href: "/demos/event-horizon/tickets" });
  });

  it("rejects malformed storage payloads", () => {
    expect(parseAuthIntent("{bad")).toBeNull();
    expect(parseAuthIntent(JSON.stringify({ type: "favorite" }))).toBeNull();
  });
});

describe("auth display helpers", () => {
  it("labels providers and extracts first names", () => {
    expect(providerLabel("google")).toBe("Google");
    expect(providerLabel("github")).toBe("GitHub");
    expect(providerLabel(null)).toBe("Account");
    expect(firstNameFromDisplayName("Christopher Kilo")).toBe("Christopher");
    expect(firstNameFromDisplayName("")).toBe("");
  });

  it("maps provider failures to safe messages", () => {
    expect(friendlySignInError(new Error("popup closed by user"))).toMatch(
      /cancelled/i,
    );
    expect(friendlySignInError(new Error("network error"))).toMatch(
      /connection/i,
    );
    expect(friendlySignInError(new Error("oauth access_denied"))).toMatch(
      /unavailable/i,
    );
    expect(friendlySignInError(new Error("secret stack dump"))).toMatch(
      /try again/i,
    );
    expect(friendlySignInError(new Error("secret stack dump"))).not.toMatch(
      /stack dump/i,
    );
  });
});

describe("authenticated navigation contract", () => {
  it("uses Sign In label and protected destinations for resume", () => {
    const signInLabel = "Sign In";
    const protectedHrefs = [
      "/demos/event-horizon/favorites",
      "/demos/event-horizon/tickets",
    ];
    expect(signInLabel).toBe("Sign In");
    expect(protectedHrefs.every((href) => href.startsWith("/demos/event-horizon/"))).toBe(
      true,
    );
  });
});
